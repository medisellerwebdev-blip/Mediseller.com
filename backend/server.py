from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import re
from datetime import datetime, timezone, timedelta
import base64
import traceback
import certifi
import ssl
import shutil
from fastapi.staticfiles import StaticFiles
import httpx
# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
ca = certifi.where()

# Mock MongoDB for local development
class MockCursor:
    def __init__(self, data):
        self._data = data
        self._skip = 0
        self._limit = len(data)

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit = n
        return self

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, length):
        data = self._data[self._skip:]
        return data[:min(length, self._limit)]
    
    def __aiter__(self):
        self._idx = self._skip
        return self
    
    async def __anext__(self):
        if self._idx < len(self._data) and self._idx < self._skip + self._limit:
            val = self._data[self._idx]
            self._idx += 1
            return val
        raise StopAsyncIteration

class MockCollection:
    def __init__(self):
        self._data = []

    def _filter_data(self, query):
        if not query:
            return self._data
        
        import re
        filtered = self._data
        for key, value in query.items():
            if key == "$or":
                or_matches = []
                for item in filtered:
                    found_or = False
                    for or_query in value:
                        for q_key, q_val in or_query.items():
                            item_val = item.get(q_key, "")
                            if isinstance(q_val, dict) and "$regex" in q_val:
                                if re.search(q_val["$regex"], str(item_val), re.I):
                                    found_or = True
                            elif item_val == q_val:
                                found_or = True
                            if found_or: break
                        if found_or: break
                    if found_or: or_matches.append(item)
                filtered = or_matches
            elif isinstance(value, dict) and "$regex" in value:
                filtered = [d for d in filtered if re.search(value["$regex"], str(d.get(key, "")), re.I)]
            else:
                filtered = [d for d in filtered if d.get(key) == value]
        return filtered

    def find(self, query=None, projection=None):
        return MockCursor(self._filter_data(query))

    async def find_one(self, query, projection=None):
        if isinstance(query, str): # Simple ID lookup
            query = {"product_id": query}
        filtered = self._filter_data(query)
        return filtered[0] if filtered else None

    async def count_documents(self, query):
        return len(self._filter_data(query))

    async def insert_one(self, doc):
        if "_id" not in doc: doc["_id"] = str(uuid.uuid4())
        self._data.append(doc)
        return type('obj', (), {'inserted_id': doc["_id"]})

    async def insert_many(self, docs):
        for d in docs: await self.insert_one(d)
        return docs

    async def update_one(self, query, update, upsert=False):
        import re
        filtered = self._filter_data(query)
        if filtered and "$set" in update:
            for item in filtered:
                item.update(update["$set"])
            return type('obj', (), {'modified_count': len(filtered)})
        return type('obj', (), {'modified_count': 0})

    async def delete_many(self, query):
        count = len(self._data)
        self._data = []
        return type('obj', (), {'deleted_count': count})

    async def create_index(self, *args, **kwargs):
        # Mock index creation as no-op
        return None

    def aggregate(self, pipeline):
        # Basic mock for categories grouping
        if pipeline and any("$group" in step for step in pipeline):
            counts = {}
            for d in self._data:
                cat = d.get("category", "Unknown")
                counts[cat] = counts.get(cat, 0) + 1
            results = [{"_id": k, "count": v} for k, v in counts.items()]
            return MockCursor(results)
        return MockCursor(self._data)

class MockDB:
    def __init__(self):
        self.products = MockCollection()
        self.testimonials = MockCollection()
        self.status_checks = MockCollection()
        self.carts = MockCollection()
        self.orders = MockCollection()
        self.users = MockCollection()
        self.user_sessions = MockCollection()
        self.prescriptions = MockCollection()
        self.consultations = MockCollection()
        self.site_config = MockCollection()
        self.coupons = MockCollection()
        self.posts = MockCollection()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
USE_MOCK_DB = os.environ.get('USE_MOCK_DB', 'False').lower() == 'true'

if USE_MOCK_DB:
    logger.info("ENVIRONMENT: Using MockDB (In-Memory)")
    db = MockDB()
else:
    try:
        mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
        if not mongo_url:
            raise ValueError("MONGODB_URI or MONGO_URL not found in environment")
            
        mongo_client = AsyncIOMotorClient(
            mongo_url, 
            tlsCAFile=ca, 
            tlsAllowInvalidCertificates=True,
            tlsAllowInvalidHostnames=True,
            ssl_cert_reqs=ssl.CERT_NONE,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            maxPoolSize=50,
            minPoolSize=10,
            retryWrites=True
        )
        db = mongo_client[os.environ.get('DB_NAME', 'mediseller_v2')]
        logger.info("Connected to MongoDB Atlas with optimized pooling")
    except Exception as e:
        logger.error("!!! CRITICAL: Failed to connect to MongoDB Atlas !!!")
        logger.error(f"Error Details: {str(e)}")
        logger.error("Falling back to ephemeral MockDB. DATA WILL NOT PERSIST ON RESTART.")
        db = MockDB()
# Admin Credentials (Initial/Default)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@mediseller.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'MediSeller#Admin@2026')
ADMIN_SESSION_TOKEN = f"admin_{uuid.uuid4().hex[:16]}"

# Create the main app
app = FastAPI(title="MediSeller API", description="Online Pharmacy API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

@app.get("/")
async def root():
    return {"message": "MediSeller API - Online Pharmacy Platform", "status": "online"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mediseller-2-website.web.app",
        "https://mediseller-2-website.firebaseapp.com",
        "https://mediseller-com.onrender.com",
        "https://mediseller.onrender.com",
        "https://mediseller.com",
        "https://www.mediseller.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health-status")
async def health_status():
    """Diagnostic endpoint to check DB and connection status"""
    status = "MockDB (In-Memory)" if USE_MOCK_DB else "Production Atlas (Persisted)"
    return {
        "status": status,
        "is_mock": USE_MOCK_DB,
        "database_name": os.environ.get('DB_NAME', 'mediseller_v2'),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# =========================
# MODELS
# =========================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Product Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name: str
    generic_name: str
    brand: str
    category: str
    subcategory: Optional[str] = None
    description: str
    dosage: str
    form: str  # tablet, capsule, injection, etc.
    quantity_per_pack: int
    price: float
    original_price: float
    price_inr: Optional[float] = None
    original_price_inr: Optional[float] = None
    discount_percentage: int
    manufacturer: str
    requires_prescription: bool = True
    in_stock: bool = True
    image_url: Optional[str] = None
    usage_instructions: List[str] = Field(default_factory=list)
    side_effects: Optional[str] = None
    storage_info: Optional[str] = None
    rating: float = 4.8
    order_count: int = 150
    additional_images: List[str] = Field(default_factory=list)
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    generic_name: str
    brand: str
    category: str
    subcategory: Optional[str] = None
    description: str
    dosage: str
    form: str
    quantity_per_pack: int
    price: float
    original_price: float
    discount_percentage: int
    manufacturer: str
    requires_prescription: bool = True
    in_stock: bool = True
    image_url: Optional[str] = None
    usage_instructions: List[str] = Field(default_factory=list)
    side_effects: Optional[str] = None
    storage_info: Optional[str] = None
    rating: float = 4.8
    order_count: int = 150
    additional_images: List[str] = Field(default_factory=list)
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None

import hashlib
import secrets

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(8)
    phash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{phash}:{salt}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or ":" not in hashed_password: return False
    phash, salt = hashed_password.split(":")
    return hashlib.sha256((plain_password + salt).encode()).hexdigest() == phash

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    password: Optional[str] = None  # In a real app, this should be password_hash
    picture: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Cart Models
class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_id: str = Field(default_factory=lambda: f"cart_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1
    session_id: Optional[str] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    price: float
    price_inr: Optional[float] = None
    dosage: str

class ShippingAddress(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    country: str
    postal_code: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"ORD{uuid.uuid4().hex[:8].upper()}")
    user_id: Optional[str] = None
    guest_email: Optional[str] = None
    items: List[OrderItem]
    shipping_address: ShippingAddress
    subtotal: float
    shipping_cost: float = 15.00
    total: float
    currency: str = "USD"
    status: str = "pending"
    prescription_id: Optional[str] = None
    payment_status: str = "pending"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    currency: str = "USD"
    prescription_id: Optional[str] = None
    notes: Optional[str] = None

# Prescription Models
class Prescription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    prescription_id: str = Field(default_factory=lambda: f"rx_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    guest_email: Optional[str] = None
    file_name: str
    file_data: str  # base64 encoded
    file_type: str
    status: str = "pending"  # pending, approved, rejected
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PrescriptionUploadRequest(BaseModel):
    file_name: str
    file_data: str
    file_type: str
    guest_email: Optional[str] = None

# Testimonial Models
class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    testimonial_id: str = Field(default_factory=lambda: f"test_{uuid.uuid4().hex[:8]}")
    name: str
    country: str
    rating: int
    comment: str
    avatar_url: Optional[str] = None
    verified: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Site Config Models
class NavItem(BaseModel):
    label: str
    path: str

class HeaderConfig(BaseModel):
    logo_text: str = "MediSeller"
    logo_url: Optional[str] = None
    nav_items: List[NavItem] = []

class ButtonConfig(BaseModel):
    text: str
    path: str

class HeroConfig(BaseModel):
    badge: str = "45+ Years of Heritage"
    title: str = "Global Access to Authentic Medicine"
    subtitle: str = "Secure 100% original generic medications from India. Save over 60% with insured delivery to 30+ countries. Trusted by patients worldwide for nearly half a century."
    primary_cta: ButtonConfig = Field(default_factory=lambda: ButtonConfig(text="Browse Products", path="/products"))
    secondary_cta: ButtonConfig = Field(default_factory=lambda: ButtonConfig(text="Expert Consultation", path="/consultation"))
    image_url: str = "https://images.unsplash.com/photo-1576091358783-a212ec293ff3?w=800"
    background_image_url: Optional[str] = None
    patients_count: str = "150K+"
    rating: float = 4.9
    trust_avatars: List[str] = []
    floating_card_title: str = "100% Authentic"
    floating_card_subtitle: str = "Verified Products"
    floating_card_icon: str = "CheckCircle"
    savings_badge_percentage: str = "60%"
    savings_badge_text: str = "Average Savings"

class StatItem(BaseModel):
    value: str
    label: str

class StatsConfig(BaseModel):
    items: List[StatItem] = Field(default_factory=lambda: [
        {"value": "45+", "label": "Years Experience"},
        {"value": "150K+", "label": "Patients Served"},
        {"value": "30+", "label": "Countries"}
    ])

class CategoryCard(BaseModel):
    id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:6]}")
    title: str
    slug: str
    subtitle: str
    icon_name: str
    color_class: str = "from-primary/10 to-primary/5"
    path: str

class CategoriesSectionConfig(BaseModel):
    badge: str = "Browse by Category"
    title: str = "Life-Saving & Lifestyle Medications"
    subtitle: str = "We specialize in affordable generic medications for serious health conditions. All products are sourced from licensed manufacturers."
    cards: List[CategoryCard] = []

class FeatureItem(BaseModel):
    title: str
    description: str
    icon_name: str = "Shield"

class HowItWorksStep(BaseModel):
    step: str
    title: str
    description: str
    icon: str = ""

class HowItWorksConfig(BaseModel):
    badge: str = "How It Works"
    title: str = "Simple 4-Step Process"
    subtitle: str = "Getting your medications delivered is easy. Follow these simple steps to start saving."
    button_text: str = "Upload Prescription Now"
    steps: List[HowItWorksStep] = Field(default_factory=lambda: [])

class TestimonialItem(BaseModel):
    name: str
    country: str
    comment: str
    rating: int = 5
    avatar_url: Optional[str] = None

class TestimonialsConfig(BaseModel):
    badge: str = "Customer Stories"
    title: str = "What Our Customers Say"
    subtitle: str = "Trusted by thousands of patients worldwide. Here's what they have to say about us."
    items: List[TestimonialItem] = []

class FAQItem(BaseModel):
    question: str
    answer: str

class FAQConfig(BaseModel):
    badge: str = "FAQ"
    title: str = "Frequently Asked Questions"
    items: List[FAQItem] = []

class MilestoneItem(BaseModel):
    year: str
    event: str

class AboutConfig(BaseModel):
    hero_badge: str = "45+ Years of Excellence"
    hero_title: str = "Trusted Pharmaceutical Partner Since 1981"
    hero_subtitle: str = "MediSeller has been at the forefront of pharmaceutical distribution for over four decades."
    mission_title: str = "Our Mission"
    mission_text: str = "To make life-saving medications accessible and affordable to patients worldwide."
    vision_title: str = "Our Vision"
    vision_text: str = "To become the most trusted global online pharmacy, known for authenticity and affordability."
    stats: List[StatItem] = Field(default_factory=lambda: [
        {"value": "45+", "label": "Years Experience"},
        {"value": "150K+", "label": "Patients Served"},
        {"value": "30+", "label": "Countries"},
        {"value": "99%", "label": "Delivery Rate"}
    ])
    advantage_section: List[FeatureItem] = Field(default_factory=lambda: [
        {"title": "100% Authentic Products", "description": "All medications are sourced directly from licensed manufacturers.", "icon_name": "Shield"},
        {"title": "Global Delivery", "description": "Insured express air shipping to over 30 countries.", "icon_name": "Truck"},
        {"title": "60%+ Savings", "description": "Significant cost savings on brand-name equivalent medications.", "icon_name": "TrendingDown"}
    ])
    advantage_title: str = "The MediSeller Advantage"
    advantage_subtitle: str = "What sets us apart in the pharmaceutical distribution industry"
    compliance_section: dict = Field(default_factory=lambda: {
        "title": "Licensed & Certified",
        "subtitle": "MediSeller (A Unit of Medicare) is a government-certified global exporter, all-India wholesaler, and retailer of authentic pharmaceutical products.",
        "gst_number": "07AAIPG2896A1ZV",
        "iec_code": "0514067152"
    })
    bottom_cta: dict = Field(default_factory=lambda: {
        "title": "Ready to Get Started?",
        "subtitle": "Browse our catalog of authentic medications or speak with our expert team to find the right solutions.",
        "primary_button_text": "Browse Products",
        "primary_button_link": "/products",
        "secondary_button_text": "Talk to Expert",
        "secondary_button_link": "/consultation"
    })
    timeline_title: str = "Our Journey"
    timeline_subtitle: str = "45+ years of growth, trust, and commitment to patient care"
    timeline: List[MilestoneItem] = Field(default_factory=lambda: [
        {"year": "1981", "event": "Medicare established as a retail pharmacy in New Delhi."},
        {"year": "2005", "event": "Expanded into wholesale distribution across North India."},
        {"year": "2014", "event": "Launched global export division under the MediSeller brand."},
        {"year": "2024", "event": "Reached 150,000+ satisfied patients worldwide."}
    ])

class ContactConfig(BaseModel):
    hero_title: str = "Contact Us"
    hero_subtitle: str = "Have questions? We're here to help. Reach out to our team and we'll get back to you soon."
    address: str = "No. 1520/110, First Floor, Jagson Pal Building, Bhagirath Palace, Chandni Chowk, New Delhi - 110006"
    phone: str = "+1 (234) 567-890"
    email: str = "support@mediseller.com"
    business_hours: List[str] = ["Monday - Friday: 9:00 AM - 6:00 PM IST", "Saturday: 10:00 AM - 4:00 PM IST", "Sunday: Closed"]
    whatsapp_number: str = "1234567890"
    whatsapp_title: str = "WhatsApp Support"
    whatsapp_description: str = "Get instant support via WhatsApp for quick queries and order updates."

class SocialLink(BaseModel):
    platform: str
    url: str

class FooterConfig(BaseModel):
    brand_description: str = "MediSeller (A Unit of Medicare) is a government-certified global exporter and wholesaler of authentic pharmaceutical products."
    social_links: List[SocialLink] = Field(default_factory=lambda: [
        {"platform": "Facebook", "url": "#"},
        {"platform": "Twitter", "url": "#"},
        {"platform": "LinkedIn", "url": "#"},
        {"platform": "Instagram", "url": "#"}
    ])
    gst_number: str = "07AAIPG2896A1ZV"
    iec_code: str = "0514067152"
    copyright_text: str = "MediSeller. All rights reserved."
    footer_links: List[dict] = Field(default_factory=lambda: [
        {"title": "Categories", "items": [
            {"label": "Cancer Medications", "path": "/products?category=Cancer"},
            {"label": "HIV/AIDS Treatment", "path": "/products?category=HIV"},
            {"label": "Hepatitis", "path": "/products?category=Hepatitis"},
            {"label": "Erectile Dysfunction", "path": "/products?category=ED"}
        ]},
        {"title": "Quick Links", "items": [
            {"label": "About Us", "path": "/about"},
            {"label": "All Products", "path": "/products"},
            {"label": "Expert Consultation", "path": "/consultation"},
            {"label": "Contact Us", "path": "/contact"}
        ]}
    ])

class PriceComparisonRow(BaseModel):
    medication: str
    brand_price: str
    mediseller_price: str
    savings: str

class PriceComparisonConfig(BaseModel):
    title: str = "US Patented vs Indian Generic: The Truth"
    subtitle: str = "Same active ingredients, same efficacy, same safety — but at a fraction of the cost. See how much you can save by choosing quality Indian generics over expensive US brand-name drugs."
    badge_text: str = "Massive Savings"
    banner_title: str = "Why Such a Huge Price Difference?"
    banner_text: str = "US pharmaceutical companies hold patents that allow them to set monopoly prices. Indian law permits licensed manufacturers to produce bioequivalent generics once patents expire or through compulsory licensing. These generics contain the same active pharmaceutical ingredients (API), undergo rigorous quality testing, and are approved by WHO, FDA, and other global regulatory bodies."
    annual_savings_title: str = "Annual Savings Example"
    annual_savings_subtitle: str = "A cancer patient taking Gleevec (Imatinib) 400mg daily could save:"
    us_annual_cost: float = 144000.0  # 12000 * 12
    us_annual_label: str = "US yearly cost"
    india_annual_cost: float = 540.0   # 45 * 12
    india_annual_label: str = "India generic yearly cost"
    shipping_annual_cost: float = 180.0 # 15 * 12
    shipping_annual_label: str = "Shipping included"
    savings_label: str = "Total Annual Savings"
    savings_footer: str = "Per year on a single medication"
    trust_indicators: List[dict] = Field(default_factory=lambda: [
        {"title": "FDA Approved Facilities", "description": "WHO-GMP certified manufacturers", "icon": "Check"},
        {"title": "Bioequivalent Formulas", "description": "Same active ingredients & efficacy", "icon": "Check"},
        {"title": "Quality Guaranteed", "description": "Batch testing & verification", "icon": "Check"}
    ])
    rows: List[PriceComparisonRow] = Field(default_factory=lambda: [
        {"medication": "Gleevec (Imatinib) 400mg", "brand_price": "$2,850", "mediseller_price": "$45", "savings": "98%"},
        {"medication": "Revlimid (Lenalidomide) 25mg", "brand_price": "$890", "mediseller_price": "$85", "savings": "90%"},
        {"medication": "Sovaldi (Sofosbuvir) 400mg", "brand_price": "$12,000", "mediseller_price": "$180", "savings": "98%"}
    ])

class PrescriptionStep(BaseModel):
    title: str
    description: str

class PrescriptionCardFeature(BaseModel):
    title: str
    description: str
    icon: str = "CheckCircle"

class PrescriptionCTAConfig(BaseModel):
    badge: str = "Prescription Required"
    title: str = "Have a Prescription?"
    subtitle: str = "Upload your prescription and our expert pharmacists will verify it within 24 hours. Or connect with our team on WhatsApp for instant assistance with your medication needs."
    text: str = "Getting your medications delivered is easy. Follow these simple steps to start saving."
    button_text: str = "Upload Prescription Now"
    steps: List[PrescriptionStep] = Field(default_factory=lambda: [
        {"title": "Upload Your Prescription", "description": "JPEG, PNG, PDF - max 10MB"},
        {"title": "Expert Verification", "description": "Our pharmacists review within 24 hours"},
        {"title": "Complete Your Order", "description": "Get best prices with doorstep delivery"}
    ])
    card_title: str = "Connect with Our Experts"
    card_subtitle: str = "Get instant help via WhatsApp - available 24/7"
    card_features: List[PrescriptionCardFeature] = Field(default_factory=lambda: [
        {"title": "Quick Response", "description": "Get replies within minutes, not hours", "icon": "Clock"},
        {"title": "Expert Guidance", "description": "Licensed pharmacists help you find the right medication", "icon": "Shield"},
        {"title": "Prescription Help", "description": "We can help source hard-to-find medications", "icon": "FileText"}
    ])
    whatsapp_number: str = "+1 (234) 567-890"
    whatsapp_cta_text: str = "Message Us on WhatsApp"

class WhatsAppCommunity(BaseModel):
    title: str
    description: str
    link: str
    icon: str = "MessageCircle"

class WhatsAppCommunitiesConfig(BaseModel):
    badge: str = "WhatsApp Communities"
    title: str = "Join Our Medical Communities"
    subtitle: str = "Connect with thousands of patients worldwide. Get exclusive offers, new product alerts, and be the first to know about flash sales and discounts."
    bottom_text: str = "Turn on notifications to never miss a deal!"
    communities: List[WhatsAppCommunity] = Field(default_factory=lambda: [])

class GlobalCTAConfig(BaseModel):
    title: str = "Need Help Finding Your Medication?"
    text: str = "Our expert pharmacists are available 24/7 to help you find the right medications at the best prices."
    primary_button: ButtonConfig = Field(default_factory=lambda: ButtonConfig(text="Request Consultation", path="/consultation"))
    secondary_button: ButtonConfig = Field(default_factory=lambda: ButtonConfig(text="Contact Us", path="/contact"))

class ShippingSettings(BaseModel):
    cost: float = 15.00
    countries: List[str] = Field(default_factory=lambda: ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland", "Ireland", "Japan", "Singapore", "South Africa", "New Zealand", "India"])
    delivery_estimate: str = "7-14 business days"

class TrustBadge(BaseModel):
    title: str
    description: str
    icon: str = "Shield"

class TrustBadgesConfig(BaseModel):
    badges: List[TrustBadge] = Field(default_factory=lambda: [
        {"title": "100% Authentic", "description": "Verified Quality", "icon": "Shield"},
        {"title": "Global Shipping", "description": "To 30+ Countries", "icon": "Truck"},
        {"title": "Secure Delivery", "description": "Insured Packages", "icon": "Package"}
    ])

class LegalPage(BaseModel):
    title: str
    content: str
    last_updated: str

class LegalPagesConfig(BaseModel):
    privacy_policy: LegalPage = Field(default_factory=lambda: LegalPage(
        title="Privacy Policy", 
        content="""# Privacy Policy

**Last Updated:** March 24, 2026

At MediSeller (A Unit of Medicare), we understand that your health information is deeply personal. We are committed to protecting your privacy and ensuring the security of the data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information.

## 1. Information We Collect
To provide our global pharmaceutical services, we collect the following types of information:
- **Personal Identification:** Name, shipping address, billing address, email address, and telephone number.
- **Medical Documentation:** Valid prescriptions as required by international law for the dispensing of certain medications.
- **Transaction Details:** Records of products purchased, payment status (processed securely through encrypted gateways), and order history.
- **Technical Data:** IP address, browser type, and usage patterns to improve our website experience.

## 2. Use of Your Information
We use the collected data strictly for the following purposes:
- **Order Fulfillment:** Processing your orders and coordinating global logistics via partners like FedEx and DHL.
- **Prescription Verification:** Ensuring all orders comply with pharmaceutical regulations.
- **Customer Support:** Providing 24/7 assistance and order tracking updates.
- **Security:** Preventing fraudulent transactions and protecting our users.

## 3. Data Protection Measures
We employ industry-leading security protocols, including 256-bit SSL encryption, secure socket layers, and advanced firewalls. Your medical documents are stored in a highly restricted environment.

## 4. Third-Party Disclosure
We **do not** sell, trade, or rent your personal data to third parties for marketing purposes. Data is only shared with:
- **Logistic Partners:** Strictly for delivery purposes.
- **Legal Authorities:** Only when required by law to comply with pharmaceutical regulations or court orders.

## 5. Your Rights
You have the right to access, correct, or request the deletion of your personal data at any time by contacting us at support@mediseller.com.
""", 
        last_updated="March 24, 2026"
    ))
    terms_of_service: LegalPage = Field(default_factory=lambda: LegalPage(
        title="Terms of Service", 
        content="""# Terms of Service

**Last Updated:** March 24, 2026

By accessing the MediSeller website and utilizing our services, you agree to be bound by the following terms and conditions. Please read them carefully.

## 1. Professional Medical Disclaimer
MediSeller (A Unit of Medicare) is a licensed pharmaceutical exporter and wholesaler. All information provided on this website is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## 2. Prescription Policy
All medications labeled as 'Prescription Only' require a valid prescription from a licensed healthcare practitioner in your country. MediSeller reserves the right to cancel any order if a valid, legible prescription is not provided within 72 hours of order placement.

## 3. Shipping and Delivery
- **Global Reach:** We ship to over 30 countries.
- **Customs & Import Duties:** Patients are responsible for ensuring that the medication being ordered is legal for import into their country. Any customs duties, taxes, or local clearance fees are the sole responsibility of the buyer.
- **Delivery Estimates:** While we strive for 7-14 business days, MediSeller is not liable for delays caused by customs processing or international postal services.

## 4. Compliance with Laws
Users must comply with all local, state, national, and international laws regarding the purchase and import of pharmaceutical products.

## 5. Limitation of Liability
MediSeller ensures that all products are sourced from WHO-GMP certified and licensed manufacturers. However, MediSeller shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the products or services provided.
""", 
        last_updated="March 24, 2026"
    ))
    refund_policy: LegalPage = Field(default_factory=lambda: LegalPage(
        title="Refund Policy", 
        content="""# Refund and Return Policy

**Last Updated:** March 24, 2026

At MediSeller, we prioritize your health and safety. Due to strict international pharmaceutical regulations and the sensitive nature of our products, our refund and return policy is designed to ensure the integrity of the global supply chain.

## 1. No-Return Policy for Medications
In accordance with international health guidelines, **medications cannot be returned** once they have been shipped. This policy is in place to prevent the re-entry of potentially compromised products into the system, ensuring that every patient receives 100% authentic and safe medication.

## 2. Order Cancellations
- **Before Dispatch:** You may cancel your order for a full refund if the request is made before the order has been processed for shipping.
- **After Dispatch:** Once an order is handed over to our logistics partners, it cannot be cancelled or refunded.

## 3. Eligibility for Refund or Reshipment
We provide a 100% Satisfaction Guarantee. We will issue a full refund or provide a free reshipment if:
- **Damaged Items:** The product arrives in a damaged or unusable condition (proof required).
- **Incorrect Order:** The items received do not match your confirmed order.
- **Non-Delivery:** The package is lost in transit and is officially confirmed as lost by the courier service.

## 4. Claims Process
To file a claim, please email us at support@mediseller.com within 7 days of the delivery date. You must include:
1. Your Order Number.
2. Clear photographs of the shipping label and the product (for damage/incorrect item claims).
3. A brief description of the issue.

## 5. Processing Time
Approved refunds will be processed within 5-10 business days and credited back to the original payment method.
""", 
        last_updated="March 24, 2026"
    ))

class FeaturedProductsConfig(BaseModel):
    badge: str = "Best Sellers"
    title: str = "Most Popular Products"
    view_all_text: str = "View All Products"

class ManufacturersConfig(BaseModel):
    subtitle: str = "Trusted products from top pharmaceutical manufacturers"

class ProductsPageConfig(BaseModel):
    title: str = "All Medications"
    subtitle: str = "Browse our selection of authentic generic medications at affordable prices"
    banner_image_url: Optional[str] = None

class SEOPageConfig(BaseModel):
    title: str = ""
    description: str = ""
    keywords: str = ""

class SEOConfig(BaseModel):
    home: SEOPageConfig = Field(default_factory=SEOPageConfig)
    about: SEOPageConfig = Field(default_factory=SEOPageConfig)
    contact: SEOPageConfig = Field(default_factory=SEOPageConfig)
    products: SEOPageConfig = Field(default_factory=SEOPageConfig)

class ShippingConfig(BaseModel):
    base_cost: float = 15.0
    free_shipping_threshold: float = 500.0
    tax_rate: float = 0.0 # Percentage

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    coupon_id: str = Field(default_factory=lambda: f"cpn_{uuid.uuid4().hex[:8]}")
    code: str
    discount_type: str = "percentage" # "percentage" or "fixed"
    value: float
    min_order_value: float = 0.0
    active: bool = True
    expiry_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: f"post_{uuid.uuid4().hex[:8]}")
    title: str
    slug: str
    content: str
    summary: str
    author: str = "MediSeller Team"
    image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    active: bool = True
    header: HeaderConfig = Field(default_factory=HeaderConfig)
    hero: HeroConfig = Field(default_factory=HeroConfig)
    stats: StatsConfig = Field(default_factory=StatsConfig)
    categories_section: CategoriesSectionConfig = Field(default_factory=CategoriesSectionConfig)
    # New Home Page Sections
    how_it_works: HowItWorksConfig = Field(default_factory=HowItWorksConfig)
    testimonials: TestimonialsConfig = Field(default_factory=TestimonialsConfig)
    faq: FAQConfig = Field(default_factory=FAQConfig)
    medical_warning: str = "Always consult your healthcare provider before starting, stopping, or changing any medication. This information is for reference only and not a substitute for professional medical advice."
    manufacturers: List[str] = Field(default_factory=lambda: ["Sun Pharma", "Cipla", "Dr. Reddy's", "Lupin", "Aurobindo", "Zydus", "Torrent", "Biocon", "Glenmark", "Hetero"])
    manufacturers_config: ManufacturersConfig = Field(default_factory=ManufacturersConfig)
    featured_products: FeaturedProductsConfig = Field(default_factory=FeaturedProductsConfig)
    # New Pages
    about_page: AboutConfig = Field(default_factory=AboutConfig)
    contact_page: ContactConfig = Field(default_factory=ContactConfig)
    footer: FooterConfig = Field(default_factory=FooterConfig)
    
    # New Dynamic Sections
    price_comparison: PriceComparisonConfig = Field(default_factory=PriceComparisonConfig)
    prescription_cta: PrescriptionCTAConfig = Field(default_factory=PrescriptionCTAConfig)
    whatsapp_communities: WhatsAppCommunitiesConfig = Field(default_factory=WhatsAppCommunitiesConfig)
    bottom_cta: GlobalCTAConfig = Field(default_factory=GlobalCTAConfig)
    
    # New Global Fields
    top_bar_text: str = "45+ Years of Trusted Service | 30+ Countries | 100% Authentic Medications"
    top_bar_phone: str = "+1 (234) 567-890"
    compliance_notice: str = "MediSeller is a licensed pharmaceutical distributor. All medications require a valid prescription. We comply with international pharmaceutical regulations and Indian pharmacy laws. Products are sourced from licensed manufacturers and undergo quality verification. Please consult your healthcare provider before starting any medication."
    
    # Parity Updates
    shipping_settings: ShippingSettings = Field(default_factory=ShippingSettings)
    trust_badges: TrustBadgesConfig = Field(default_factory=TrustBadgesConfig)
    legal_pages: LegalPagesConfig = Field(default_factory=LegalPagesConfig)
    products_page: ProductsPageConfig = Field(default_factory=ProductsPageConfig)
    product_categories: List[str] = Field(default_factory=lambda: ["Cancer", "HIV/AIDS", "Hepatitis", "Erectile Dysfunction", "Diabetes & Insulin", "Weight Loss", "Fertility", "Other"])
    
    # Advanced Admin Fields
    seo: SEOConfig = Field(default_factory=SEOConfig)
    shipping: ShippingConfig = Field(default_factory=ShippingConfig)
    
    favicon_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Contact/Inquiry Models
class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    inquiry_id: str = Field(default_factory=lambda: f"inq_{uuid.uuid4().hex[:8]}")
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

# Expert Consultation Models
class ConsultationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    consultation_id: str = Field(default_factory=lambda: f"cons_{uuid.uuid4().hex[:8]}")
    name: str
    email: EmailStr
    phone: str
    medication_query: str
    preferred_contact: str = "whatsapp"
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConsultationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    medication_query: str
    preferred_contact: str = "whatsapp"

# =========================
# AUTH HELPERS
# =========================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token cookie or auth header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def get_optional_user(request: Request) -> Optional[User]:
    """Get user if authenticated, None otherwise (for optional auth)"""
    try:
        return await get_current_user(request)
    except Exception:
        return None

# =========================
# ROUTES - Status
# =========================

@api_router.get("/")
async def root():
    return {"message": "MediSeller API - Online Pharmacy Platform"}

# Site Configuration Routes
@api_router.get("/site-config")
async def get_site_config():
    config_doc = await db.site_config.find_one({"active": True})
    if not config_doc:
        # Generate a completely default config using the Pydantic model
        default_obj = SiteConfig(active=True)
        return default_obj.model_dump()
    
    # Use Pydantic to ensure all new fields (defaults) are populated even if missing in DB
    try:
        # Convert _id if present for Pydantic (though SiteConfig doesn't have it, extra="ignore" helps)
        if "_id" in config_doc: config_doc.pop("_id")
        config_obj = SiteConfig(**config_doc)
        return config_obj.model_dump()
    except Exception as e:
        logger.error(f"Pydantic validation error for site-config: {e}")
        # Return as is if validation fails, or return a safer version
        if "_id" in config_doc: config_doc["_id"] = str(config_doc["_id"])
        return config_doc

@api_router.post("/site-config")
async def update_site_config_public_path(config: dict, request: Request):
    """Alias for admin update path to match frontend expectations"""
    return await update_site_config(config, request)

@api_router.post("/admin/site-config")
async def update_site_config(config: dict, request: Request):
    # Admin check using the common dependency logic
    session_token = request.cookies.get("admin_session")
    if session_token != ADMIN_SESSION_TOKEN:
        logger.warning(f"Unauthorized config update attempt. Token: {session_token}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Ensure health indicators are preserved or updated
    config["updated_at"] = datetime.now(timezone.utc).isoformat()
    config["active"] = True
    
    # Remove _id to avoid MongoDB immutable ID error if it was passed back
    if "_id" in config:
        del config["_id"]

    try:
        # Optimized implementation: replace or insert the active one
        await db.site_config.update_one(
            {"active": True},
            {"$set": config},
            upsert=True
        )
        return {"message": "Config updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update site config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/reset-config")
async def reset_site_config(request: Request):
    """Reset site configuration to model defaults"""
    # Admin check
    session_token = request.cookies.get("admin_session")
    if session_token != ADMIN_SESSION_TOKEN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # We'll use the canonical seed logic to ensure it's not JUST model defaults, 
        # but the actual content the user expects.
        await db.site_config.delete_many({"active": True})
        
        # We can't easily call seed_database() here because it returns a dict and handles products too.
        # Let's just create the default config dict here or move it to a helper.
        # For now, I'll just use a fresh SiteConfig().model_dump() 
        # but I'll update the SiteConfig defaults FIRST to match the website.
        
        default_config = SiteConfig(active=True).model_dump()
        default_config["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.site_config.insert_one(default_config)
        return {"message": "Site configuration has been reset to defaults"}
    except Exception as e:
        logger.error(f"Reset config error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

@api_router.get("/health")
@api_router.head("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/test-db")
async def test_db_connection():
    try:
        await client.admin.command('ping')
        return {"status": "success", "message": "Connected to MongoDB Atlas"}
    except Exception as e:
        logger.error(f"MongoDB Connection Error: {e}")
        return {"status": "error", "message": str(e)}

# =========================
# ROUTES - Auth (Emergent Google OAuth)
# =========================
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token and user data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session_data = auth_response.json()
    
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data if needed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/register")
async def register(request: Request, response: Response):
    """Register a new customer account"""
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, password, and name are required")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password": get_password_hash(password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {"user_id": user_id, "email": email, "name": name}

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    """Login with email and password"""
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    if "_id" in user: del user["_id"]
    if "password" in user: del user["password"]
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Dashboard Data Routes
@api_router.get("/orders")
async def get_customer_orders(request: Request):
    """Get orders for the logged-in user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/prescriptions")
async def get_customer_prescriptions(request: Request):
    """Get prescriptions for the logged-in user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    prescriptions = await db.prescriptions.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return prescriptions

# =========================
# ROUTES - Products
# =========================

@api_router.get("/products", response_model=List[dict])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    in_stock: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get products with optional filters"""
    try:
        query = {}
        if category:
            query["category"] = category
        if in_stock is not None:
            query["in_stock"] = in_stock
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"generic_name": {"$regex": search, "$options": "i"}},
                {"brand": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.products.find(query, {"_id": 0})
        products = await cursor.skip(skip).limit(limit).to_list(limit)
        return products
    except Exception as e:
        logger.error(f"Error in get_products: {e}")
        return [] # Return empty list instead of 500

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    """Get all product categories with counts"""
    try:
        # Redundant auto-seeding removed for performance. 
        # Seeding is now handled only on server startup or manual reset.
            
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        categories = await db.products.aggregate(pipeline).to_list(100)
        return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]
    except Exception as e:
        logger.error(f"Error in get_categories: {e}")
        return []

@api_router.get("/featured-products", response_model=List[dict])
async def get_featured_products(limit: int = 8):
    """Get featured products (highest discount)"""
    products = await db.products.find(
        {"in_stock": True},
        {"_id": 0}
    ).sort("discount_percentage", -1).limit(limit).to_list(limit)
    return products

# =========================
# ROUTES - Cart
# =========================

@api_router.post("/cart/add")
async def add_to_cart(item: AddToCartRequest, request: Request):
    """Add item to cart"""
    user = await get_optional_user(request)
    user_id = user.user_id if user else None
    session_id = item.session_id
    
    # Find existing cart
    query = {}
    if user_id:
        query["user_id"] = user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        # Create new session for guest
        session_id = f"guest_{uuid.uuid4().hex[:16]}"
    
    if query:
        cart_doc = await db.carts.find_one(query, {"_id": 0})
    else:
        cart_doc = None
    
    # Get product info
    product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if cart_doc:
        # Update existing cart
        items = cart_doc.get("items", [])
        found = False
        for cart_item in items:
            if cart_item["product_id"] == item.product_id:
                cart_item["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": product["price"],
                "price_inr": product.get("price_inr", round(product["price"] * 83))
            })
        
        await db.carts.update_one(
            query,
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        cart_doc["items"] = items
    else:
        # Create new cart
        cart_id = f"cart_{uuid.uuid4().hex[:12]}"
        cart_doc = {
            "cart_id": cart_id,
            "user_id": user_id,
            "session_id": session_id,
            "items": [{
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": product["price"],
                "price_inr": product.get("price_inr", round(product["price"] * 83))
            }],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart_doc)
        if "_id" in cart_doc:
            del cart_doc["_id"]
    
    return {"cart": cart_doc, "session_id": session_id or cart_doc.get("session_id")}

@api_router.get("/cart")
async def get_cart(user_id: Optional[str] = None, session_id: Optional[str] = None):
    """Fetch the cart for a user or session"""
    query = {}
    if user_id: query["user_id"] = user_id
    elif session_id: query["session_id"] = session_id
    else: return {"items": [], "total": 0}
    
    cart = await db.carts.find_one(query)
    if not cart: return {"items": [], "total": 0}
    
    if "_id" in cart: del cart["_id"]
    return cart

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user_id: Optional[str] = None, session_id: Optional[str] = None):
    """Update item quantity in cart"""
    query = {}
    if user_id: query["user_id"] = user_id
    elif session_id: query["session_id"] = session_id
    else: raise HTTPException(status_code=400, detail="User or Session ID required")
    
    if item.quantity <= 0:
        await db.carts.update_one(query, {"$pull": {"items": {"product_id": item.product_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    else:
        cart = await db.carts.find_one({**query, "items.product_id": item.product_id})
        if cart:
            await db.carts.update_one({**query, "items.product_id": item.product_id}, {"$set": {"items.$.quantity": item.quantity, "updated_at": datetime.now(timezone.utc).isoformat()}})
        else:
            await db.carts.update_one(query, {"$push": {"items": item.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@api_router.delete("/cart/clear")
async def clear_cart(user_id: Optional[str] = None, session_id: Optional[str] = None):
    """Clear all items from the cart"""
    query = {}
    if user_id: query["user_id"] = user_id
    elif session_id: query["session_id"] = session_id
    else: raise HTTPException(status_code=400, detail="User or Session ID required")
    
    await db.carts.update_one(query, {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@api_router.get("/health-check")
async def health_check():
    """Simple health check for Render"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# =========================
# ROUTES - Admin
# =========================

class AdminLoginRequest(BaseModel):
    email: str
    password: str

@api_router.post("/admin/login")
async def admin_login(data: AdminLoginRequest, response: Response):
    """Admin login with email/password"""
    if data.email == ADMIN_EMAIL and data.password == ADMIN_PASSWORD:
        # For simplicity in local dev, we use a fixed token or session
        response.set_cookie(
            key="admin_session",
            value=ADMIN_SESSION_TOKEN,
            httponly=True,
            samesite="none",  # Required for cross-port local dev
            secure=True,      # Required when samesite="none"
            path="/",
            max_age=24 * 60 * 60
        )
        return {"success": True, "message": "Admin logged in successfully"}
    
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

async def verify_admin(request: Request):
    """Dependency to verify admin session"""
    admin_session = request.cookies.get("admin_session")
    if admin_session != ADMIN_SESSION_TOKEN:
        raise HTTPException(status_code=403, detail="Admin access denied")
    return True

@api_router.get("/admin/verify")
async def verify_admin_token(is_admin: bool = Depends(verify_admin)):
    return {"is_admin": is_admin}

# Admin Product Management
@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate, is_admin: bool = Depends(verify_admin)):
    product_dict = product.model_dump()
    new_product = Product(**product_dict)
    doc = new_product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return new_product

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: dict, is_admin: bool = Depends(verify_admin)):
    if "_id" in product_data: del product_data["_id"]
    # Ensure product_id remains consistent if passed in data
    if "product_id" in product_data: del product_data["product_id"]
    
    result = await db.products.update_one({"product_id": product_id}, {"$set": product_data})
    if result.modified_count == 0:
        # Check if product exists but no changes were made
        exists = await db.products.find_one({"product_id": product_id})
        if not exists:
            raise HTTPException(status_code=404, detail="Product not found")
            
    return {"success": True, "modified_count": result.modified_count}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, is_admin: bool = Depends(verify_admin)):
    await db.products.delete_one({"product_id": product_id})
    return {"success": True}

# Admin Order Management
@api_router.get("/admin/orders")
async def get_all_orders(is_admin: bool = Depends(verify_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: dict, is_admin: bool = Depends(verify_admin)):
    status = data.get("status")
    if not status: raise HTTPException(status_code=400, detail="Status required")
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": status}})
    return {"success": True}

# Admin Management Routes for Queries/Consultations/Prescriptions
@api_router.get("/admin/inquiries")
async def get_all_inquiries(is_admin: bool = Depends(verify_admin)):
    inquiries = await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return inquiries

@api_router.put("/admin/inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, data: dict, is_admin: bool = Depends(verify_admin)):
    status = data.get("status")
    await db.inquiries.update_one({"inquiry_id": inquiry_id}, {"$set": {"status": status}})
    return {"success": True}

@api_router.get("/admin/consultations")
async def get_all_consultations(is_admin: bool = Depends(verify_admin)):
    consultations = await db.consultations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return consultations

@api_router.put("/admin/consultations/{consultation_id}/status")
async def update_consultation_status(consultation_id: str, data: dict, is_admin: bool = Depends(verify_admin)):
    status = data.get("status")
    await db.consultations.update_one({"consultation_id": consultation_id}, {"$set": {"status": status}})
    return {"success": True}

@api_router.get("/admin/prescriptions")
async def get_all_prescriptions(is_admin: bool = Depends(verify_admin)):
    prescriptions = await db.prescriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return prescriptions

@api_router.put("/admin/prescriptions/{prescription_id}/status")
async def update_prescription_status(prescription_id: str, data: dict, is_admin: bool = Depends(verify_admin)):
    status = data.get("status")
    await db.prescriptions.update_one({"prescription_id": prescription_id}, {"$set": {"status": status}})
    return {"success": True}

# Admin Analytics
@api_router.get("/admin/analytics")
async def get_analytics(is_admin: bool = Depends(verify_admin)):
    """Get business analytics summary and trends"""
    try:
        # Summary Metrics
        total_orders = await db.orders.count_documents({})
        total_products = await db.products.count_documents({})
        total_users = await db.users.count_documents({})
        
        # Revenue Calculation (approximate)
        cursor = db.orders.find({}, {"total": 1, "currency": 1})
        total_revenue_usd = 0
        async for order in cursor:
            if order.get("currency") == "INR":
                total_revenue_usd += order.get("total", 0) / 83
            else:
                total_revenue_usd += order.get("total", 0)
        
        # Sales Trends (last 7 days - mock aggregation for now)
        # In a real app, we'd use mongodb aggregate pipeline
        sales_trend = []
        for i in range(6, -1, -1):
            date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            sales_trend.append({"date": date, "sales": 0, "revenue": 0})
            
        cursor = db.orders.find({})
        async for order in cursor:
            # Simple sorting into trend buckets
            order_date = order.get("created_at")[:10] if isinstance(order.get("created_at"), str) else ""
            for item in sales_trend:
                if item["date"] == order_date:
                    item["sales"] += 1
                    rev = order.get("total", 0)
                    if order.get("currency") == "INR": rev /= 83
                    item["revenue"] += round(rev, 2)
        
        # Category Popularity
        category_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        categories_data = []
        cursor = db.products.aggregate(category_pipeline)
        async for cat in cursor:
            categories_data.append({"name": cat["_id"], "value": cat["count"]})
            
        return {
            "summary": {
                "totalOrders": total_orders,
                "totalRevenue": round(total_revenue_usd, 2),
                "totalProducts": total_products,
                "totalUsers": total_users
            },
            "salesTrend": sales_trend,
            "categories": categories_data
        }
    except Exception as e:
        logger.error(f"Analytics failure: {e}")
        return {"error": str(e)}

# Admin User Management
@api_router.get("/admin/users")
async def get_all_users(is_admin: bool = Depends(verify_admin)):
    """List all registered users with their order history summary"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        order_count = await db.orders.count_documents({"user_id": user.get("user_id")})
        user["order_count"] = order_count
    return users

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, data: dict, is_admin: bool = Depends(verify_admin)):
    active = data.get("active", True)
    await db.users.update_one({"user_id": user_id}, {"$set": {"active": active}})
    return {"success": True}

# Admin Coupon Management
@api_router.get("/admin/coupons")
async def get_coupons(is_admin: bool = Depends(verify_admin)):
    return await db.coupons.find({}, {"_id": 0}).to_list(100)

@api_router.post("/admin/coupons")
async def create_coupon(coupon: Coupon, is_admin: bool = Depends(verify_admin)):
    doc = coupon.model_dump()
    if doc.get("expiry_date"):
        doc["expiry_date"] = doc["expiry_date"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.coupons.insert_one(doc)
    return coupon

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, is_admin: bool = Depends(verify_admin)):
    await db.coupons.delete_one({"coupon_id": coupon_id})
    return {"success": True}

# Admin Blog Management
@api_router.get("/admin/blog")
async def get_all_posts(is_admin: bool = Depends(verify_admin)):
    return await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/admin/blog")
async def create_post(post: BlogPost, is_admin: bool = Depends(verify_admin)):
    doc = post.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.posts.insert_one(doc)
    return post

@api_router.delete("/admin/blog/{post_id}")
async def delete_post(post_id: str, is_admin: bool = Depends(verify_admin)):
    await db.posts.delete_one({"post_id": post_id})
    return {"success": True}

# =========================
async def get_cart(session_id: Optional[str] = None, request: Request = None):
    """Get cart contents"""
    user = await get_optional_user(request) if request else None
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        return {"items": [], "total": 0}
    
    cart_doc = await db.carts.find_one(query, {"_id": 0})
    
    if not cart_doc:
        return {"items": [], "total": 0}
    
    # Enrich with product details
    enriched_items = []
    total = 0
    
    for item in cart_doc.get("items", []):
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            enriched_items.append({
                **item,
                "name": product["name"],
                "brand": product["brand"],
                "dosage": product["dosage"],
                "image_url": product.get("image_url"),
                "requires_prescription": product.get("requires_prescription", True)
            })
            total += item["price"] * item["quantity"]
    
    return {
        "cart_id": cart_doc.get("cart_id"),
        "items": enriched_items,
        "total": round(total, 2),
        "session_id": cart_doc.get("session_id")
    }

@api_router.put("/cart/update")
async def update_cart_item(
    product_id: str,
    quantity: int,
    session_id: Optional[str] = None,
    request: Request = None
):
    """Update cart item quantity"""
    user = await get_optional_user(request) if request else None
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    cart_doc = await db.carts.find_one(query, {"_id": 0})
    if not cart_doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart_doc.get("items", [])
    
    if quantity <= 0:
        items = [i for i in items if i["product_id"] != product_id]
    else:
        for item in items:
            if item["product_id"] == product_id:
                item["quantity"] = quantity
                break
    
    await db.carts.update_one(
        query,
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/clear")
async def clear_cart(session_id: Optional[str] = None, request: Request = None):
    """Clear cart"""
    user = await get_optional_user(request) if request else None
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        return {"message": "No cart to clear"}
    
    await db.carts.delete_one(query)
    return {"message": "Cart cleared"}

# =========================
# ROUTES - Orders
# =========================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request):
    """Create new order (guest or authenticated)"""
    user = await get_optional_user(request)
    
    # Calculate totals based on currency
    if order_data.currency == "INR":
        subtotal = sum((item.price_inr or (item.price * 83)) * item.quantity for item in order_data.items)
        shipping_cost = 1200.0 # ~15 USD in INR
    else:
        subtotal = sum(item.price * item.quantity for item in order_data.items)
        shipping_cost = 15.00
    
    total = subtotal + shipping_cost
    
    order = Order(
        user_id=user.user_id if user else None,
        guest_email=order_data.shipping_address.email if not user else None,
        items=[item.model_dump() for item in order_data.items],
        shipping_address=order_data.shipping_address.model_dump(),
        subtotal=round(subtotal, 2),
        shipping_cost=shipping_cost,
        total=round(total, 2),
        currency=order_data.currency,
        prescription_id=order_data.prescription_id,
        notes=order_data.notes
    )
    
    order_doc = order.model_dump()
    order_doc["created_at"] = order_doc["created_at"].isoformat()
    
    await db.orders.insert_one(order_doc)
    if "_id" in order_doc:
        del order_doc["_id"]
    
    return order_doc

@api_router.get("/orders")
async def get_orders(request: Request):
    """Get user's orders"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    orders = await db.orders.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, email: Optional[str] = None, request: Request = None):
    """Get order by ID (authenticated user or guest with email)"""
    user = await get_optional_user(request) if request else None
    
    query = {"order_id": order_id}
    if user:
        query["user_id"] = user.user_id
    elif email:
        query["guest_email"] = email
    
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

# =========================
# ROUTES - Prescriptions
# =========================

@api_router.post("/prescriptions/upload")
async def upload_prescription(data: PrescriptionUploadRequest, request: Request):
    """Upload prescription"""
    user = await get_optional_user(request)
    
    prescription = Prescription(
        user_id=user.user_id if user else None,
        guest_email=data.guest_email if not user else None,
        file_name=data.file_name,
        file_data=data.file_data,
        file_type=data.file_type
    )
    
    prescription_doc = prescription.model_dump()
    prescription_doc["created_at"] = prescription_doc["created_at"].isoformat()
    
    await db.prescriptions.insert_one(prescription_doc)
    
    return {
        "prescription_id": prescription.prescription_id,
        "status": prescription.status,
        "message": "Prescription uploaded successfully"
    }

@api_router.get("/prescriptions")
async def get_prescriptions(request: Request):
    """Get user's prescriptions"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    prescriptions = await db.prescriptions.find(
        {"user_id": user.user_id},
        {"_id": 0, "file_data": 0}  # Exclude file data for listing
    ).sort("created_at", -1).to_list(100)
    
    return prescriptions

# =========================
# ROUTES - Testimonials
# =========================

@api_router.get("/testimonials", response_model=List[dict])
async def get_testimonials(limit: int = 10):
    """Get customer testimonials"""
    testimonials = await db.testimonials.find(
        {"verified": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return testimonials

# =========================
# ROUTES - Contact/Inquiry
# =========================

@api_router.post("/inquiries")
async def create_inquiry(inquiry: InquiryCreate):
    """Submit contact inquiry"""
    inquiry_obj = Inquiry(**inquiry.model_dump())
    inquiry_doc = inquiry_obj.model_dump()
    inquiry_doc["created_at"] = inquiry_doc["created_at"].isoformat()
    
    await db.inquiries.insert_one(inquiry_doc)
    
    return {
        "inquiry_id": inquiry_obj.inquiry_id,
        "message": "Your inquiry has been submitted. We'll get back to you shortly."
    }

# =========================
# ROUTES - Expert Consultation
# =========================

@api_router.post("/consultations")
async def request_consultation(consultation: ConsultationCreate):
    """Request expert consultation"""
    consultation_obj = ConsultationRequest(**consultation.model_dump())
    consultation_doc = consultation_obj.model_dump()
    consultation_doc["created_at"] = consultation_doc["created_at"].isoformat()
    
    await db.consultations.insert_one(consultation_doc)
    
    return {
        "consultation_id": consultation_obj.consultation_id,
        "message": "Consultation request submitted. Our expert will contact you soon."
    }

# =========================
# ROUTES - Site Config
# =========================

# Redundant endpoint removed to avoid conflicts

# Redundant endpoint removed to avoid conflicts

# =========================
# SEED DATA
# =========================

@api_router.get("/seed")
@api_router.post("/seed")
async def seed_database():
    """Seed database with initial data"""
    
    # Check if already seeded
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": "Database already seeded", "products": existing_products}
    
    logger.info("Starting database seed process...")
    
    # Categories and their products
    products_data = []
    
    # CANCER MEDICATIONS (20)
    cancer_meds = [
        {"name": "Gleevec", "generic_name": "Imatinib Mesylate", "brand": "Novartis", "dosage": "400mg", "price": 45.00, "original_price": 2850.00, "discount": 98, "desc": "Treatment for chronic myeloid leukemia (CML) and gastrointestinal stromal tumors (GIST)"},
        {"name": "Revlimid", "generic_name": "Lenalidomide", "brand": "Celgene", "dosage": "25mg", "price": 85.00, "original_price": 890.00, "discount": 90, "desc": "Treatment for multiple myeloma and myelodysplastic syndromes"},
        {"name": "Ibrutinib", "generic_name": "Imbruvica", "brand": "Pharmacyclics", "dosage": "140mg", "price": 120.00, "original_price": 1200.00, "discount": 90, "desc": "Treatment for chronic lymphocytic leukemia and mantle cell lymphoma"},
        {"name": "Tarceva", "generic_name": "Erlotinib", "brand": "Roche", "dosage": "150mg", "price": 55.00, "original_price": 450.00, "discount": 88, "desc": "Treatment for non-small cell lung cancer and pancreatic cancer"},
        {"name": "Xeloda", "generic_name": "Capecitabine", "brand": "Roche", "dosage": "500mg", "price": 25.00, "original_price": 180.00, "discount": 86, "desc": "Treatment for breast cancer and colorectal cancer"},
        {"name": "Nexavar", "generic_name": "Sorafenib", "brand": "Bayer", "dosage": "200mg", "price": 95.00, "original_price": 750.00, "discount": 87, "desc": "Treatment for liver, kidney, and thyroid cancer"},
        {"name": "Afinitor", "generic_name": "Everolimus", "brand": "Novartis", "dosage": "10mg", "price": 75.00, "original_price": 620.00, "discount": 88, "desc": "Treatment for advanced kidney cancer and neuroendocrine tumors"},
        {"name": "Sprycel", "generic_name": "Dasatinib", "brand": "Bristol-Myers", "dosage": "100mg", "price": 88.00, "original_price": 890.00, "discount": 90, "desc": "Treatment for chronic myeloid leukemia (CML)"},
        {"name": "Votrient", "generic_name": "Pazopanib", "brand": "GSK", "dosage": "400mg", "price": 65.00, "original_price": 520.00, "discount": 87, "desc": "Treatment for advanced renal cell carcinoma and soft tissue sarcoma"},
        {"name": "Sutent", "generic_name": "Sunitinib", "brand": "Pfizer", "dosage": "50mg", "price": 110.00, "original_price": 950.00, "discount": 88, "desc": "Treatment for kidney cancer and GIST"},
        {"name": "Xtandi", "generic_name": "Enzalutamide", "brand": "Astellas", "dosage": "40mg", "price": 95.00, "original_price": 850.00, "discount": 89, "desc": "Treatment for metastatic prostate cancer"},
        {"name": "Zytiga", "generic_name": "Abiraterone Acetate", "brand": "J&J", "dosage": "250mg", "price": 35.00, "original_price": 280.00, "discount": 87, "desc": "Treatment for metastatic castration-resistant prostate cancer"},
        {"name": "Tagrisso", "generic_name": "Osimertinib", "brand": "AstraZeneca", "dosage": "80mg", "price": 145.00, "original_price": 1500.00, "discount": 90, "desc": "Treatment for EGFR-mutated non-small cell lung cancer"},
        {"name": "Keytruda", "generic_name": "Pembrolizumab", "brand": "Merck", "dosage": "100mg", "price": 450.00, "original_price": 5200.00, "discount": 91, "desc": "Immunotherapy for various cancer types"},
        {"name": "Opdivo", "generic_name": "Nivolumab", "brand": "BMS", "dosage": "100mg", "price": 420.00, "original_price": 4800.00, "discount": 91, "desc": "Immunotherapy for melanoma, lung, and kidney cancer"},
        {"name": "Herceptin", "generic_name": "Trastuzumab", "brand": "Roche", "dosage": "440mg", "price": 380.00, "original_price": 3500.00, "discount": 89, "desc": "Treatment for HER2-positive breast and gastric cancer"},
        {"name": "Alecensa", "generic_name": "Alectinib", "brand": "Roche", "dosage": "150mg", "price": 125.00, "original_price": 1100.00, "discount": 89, "desc": "Treatment for ALK-positive non-small cell lung cancer"},
        {"name": "Lynparza", "generic_name": "Olaparib", "brand": "AstraZeneca", "dosage": "150mg", "price": 135.00, "original_price": 1250.00, "discount": 89, "desc": "Treatment for BRCA-mutated ovarian and breast cancer"},
        {"name": "Venclexta", "generic_name": "Venetoclax", "brand": "AbbVie", "dosage": "100mg", "price": 95.00, "original_price": 820.00, "discount": 88, "desc": "Treatment for chronic lymphocytic leukemia"},
        {"name": "Pomalyst", "generic_name": "Pomalidomide", "brand": "Celgene", "dosage": "4mg", "price": 110.00, "original_price": 980.00, "discount": 89, "desc": "Treatment for multiple myeloma"},
    ]
    
    for med in cancer_meds:
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "cancer",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": "Tablet",
            "quantity_per_pack": 30,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
            "usage_instructions": ["Take with water after meals", "Consult your doctor for dosage adjustments"],
            "side_effects": "Nausea, fatigue, and mild headache are common.",
            "storage_info": "Store at room temperature (20-25°C).",
            "rating": 4.8,
            "order_count": 120,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # HIV MEDICATIONS (20)
    hiv_meds = [
        {"name": "Tenvir-EM", "generic_name": "Tenofovir + Emtricitabine", "brand": "Cipla", "dosage": "300mg/200mg", "price": 25.00, "original_price": 1800.00, "discount": 99, "desc": "Combination HIV prevention and treatment medication (PrEP)"},
        {"name": "Atripla", "generic_name": "Efavirenz/Emtricitabine/Tenofovir", "brand": "Gilead", "dosage": "600/200/300mg", "price": 35.00, "original_price": 2500.00, "discount": 99, "desc": "Complete single-tablet HIV treatment regimen"},
        {"name": "Truvada", "generic_name": "Emtricitabine/Tenofovir", "brand": "Gilead", "dosage": "200/300mg", "price": 28.00, "original_price": 1900.00, "discount": 99, "desc": "HIV prevention (PrEP) and treatment backbone"},
        {"name": "Biktarvy", "generic_name": "Bictegravir/Emtricitabine/TAF", "brand": "Gilead", "dosage": "50/200/25mg", "price": 55.00, "original_price": 3200.00, "discount": 98, "desc": "Complete single-tablet HIV-1 treatment"},
        {"name": "Descovy", "generic_name": "Emtricitabine/TAF", "brand": "Gilead", "dosage": "200/25mg", "price": 32.00, "original_price": 2100.00, "discount": 98, "desc": "HIV prevention and treatment with improved renal safety"},
        {"name": "Genvoya", "generic_name": "Elvitegravir/Cobicistat/FTC/TAF", "brand": "Gilead", "dosage": "150/150/200/10mg", "price": 48.00, "original_price": 3000.00, "discount": 98, "desc": "Complete single-tablet HIV treatment"},
        {"name": "Triumeq", "generic_name": "Dolutegravir/Abacavir/Lamivudine", "brand": "ViiV", "dosage": "50/600/300mg", "price": 45.00, "original_price": 2800.00, "discount": 98, "desc": "Once-daily complete HIV treatment"},
        {"name": "Dovato", "generic_name": "Dolutegravir/Lamivudine", "brand": "ViiV", "dosage": "50/300mg", "price": 38.00, "original_price": 2400.00, "discount": 98, "desc": "Two-drug complete HIV treatment regimen"},
        {"name": "Tivicay", "generic_name": "Dolutegravir", "brand": "ViiV", "dosage": "50mg", "price": 22.00, "original_price": 1500.00, "discount": 99, "desc": "Integrase inhibitor for HIV treatment"},
        {"name": "Isentress", "generic_name": "Raltegravir", "brand": "Merck", "dosage": "400mg", "price": 28.00, "original_price": 1200.00, "discount": 98, "desc": "First-in-class integrase inhibitor"},
        {"name": "Prezista", "generic_name": "Darunavir", "brand": "J&J", "dosage": "800mg", "price": 18.00, "original_price": 980.00, "discount": 98, "desc": "Protease inhibitor for HIV treatment"},
        {"name": "Kaletra", "generic_name": "Lopinavir/Ritonavir", "brand": "AbbVie", "dosage": "200/50mg", "price": 15.00, "original_price": 650.00, "discount": 98, "desc": "Boosted protease inhibitor combination"},
        {"name": "Epivir", "generic_name": "Lamivudine", "brand": "GSK", "dosage": "150mg", "price": 8.00, "original_price": 450.00, "discount": 98, "desc": "NRTI for HIV and hepatitis B treatment"},
        {"name": "Viread", "generic_name": "Tenofovir", "brand": "Gilead", "dosage": "300mg", "price": 12.00, "original_price": 980.00, "discount": 99, "desc": "NRTI backbone for HIV treatment"},
        {"name": "Sustiva", "generic_name": "Efavirenz", "brand": "BMS", "dosage": "600mg", "price": 10.00, "original_price": 720.00, "discount": 99, "desc": "NNRTI for HIV treatment"},
        {"name": "Edurant", "generic_name": "Rilpivirine", "brand": "J&J", "dosage": "25mg", "price": 15.00, "original_price": 850.00, "discount": 98, "desc": "NNRTI with improved tolerability"},
        {"name": "Selzentry", "generic_name": "Maraviroc", "brand": "Pfizer", "dosage": "300mg", "price": 35.00, "original_price": 1400.00, "discount": 97, "desc": "CCR5 antagonist for HIV treatment"},
        {"name": "Fuzeon", "generic_name": "Enfuvirtide", "brand": "Roche", "dosage": "90mg", "price": 180.00, "original_price": 2800.00, "discount": 94, "desc": "Fusion inhibitor for treatment-experienced patients"},
        {"name": "Cabenuva", "generic_name": "Cabotegravir/Rilpivirine", "brand": "ViiV", "dosage": "400/600mg", "price": 250.00, "original_price": 3500.00, "discount": 93, "desc": "Long-acting injectable HIV treatment"},
        {"name": "Rukobia", "generic_name": "Fostemsavir", "brand": "ViiV", "dosage": "600mg", "price": 85.00, "original_price": 1800.00, "discount": 95, "desc": "Attachment inhibitor for heavily treated patients"},
    ]
    
    for med in hiv_meds:
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "hiv",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": "Tablet",
            "quantity_per_pack": 30,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
            "usage_instructions": ["Take once daily", "Avoid skipping doses", "Monitor VL regularily"],
            "side_effects": "Common side effects include fatigue and minor digestive issues.",
            "storage_info": "Store at room temperature away from children.",
            "rating": 4.9,
            "order_count": 210,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # HEPATITIS MEDICATIONS (20)
    hepatitis_meds = [
        {"name": "Epclusa", "generic_name": "Sofosbuvir/Velpatasvir", "brand": "Gilead", "dosage": "400/100mg", "price": 65.00, "original_price": 26000.00, "discount": 99, "desc": "Pan-genotypic Hepatitis C treatment"},
        {"name": "Harvoni", "generic_name": "Ledipasvir/Sofosbuvir", "brand": "Gilead", "dosage": "90/400mg", "price": 75.00, "original_price": 31500.00, "discount": 99, "desc": "Complete Hepatitis C genotype 1 treatment"},
        {"name": "Sovaldi", "generic_name": "Sofosbuvir", "brand": "Gilead", "dosage": "400mg", "price": 45.00, "original_price": 28000.00, "discount": 99, "desc": "NS5B polymerase inhibitor for HCV"},
        {"name": "Mavyret", "generic_name": "Glecaprevir/Pibrentasvir", "brand": "AbbVie", "dosage": "100/40mg", "price": 85.00, "original_price": 13200.00, "discount": 99, "desc": "8-week pan-genotypic HCV treatment"},
        {"name": "Zepatier", "generic_name": "Elbasvir/Grazoprevir", "brand": "Merck", "dosage": "50/100mg", "price": 55.00, "original_price": 18200.00, "discount": 99, "desc": "Once-daily HCV genotype 1 and 4 treatment"},
        {"name": "Vosevi", "generic_name": "Sofosbuvir/Velpatasvir/Voxilaprevir", "brand": "Gilead", "dosage": "400/100/100mg", "price": 95.00, "original_price": 24920.00, "discount": 99, "desc": "Salvage therapy for treatment-experienced HCV"},
        {"name": "Daklinza", "generic_name": "Daclatasvir", "brand": "BMS", "dosage": "60mg", "price": 35.00, "original_price": 15000.00, "discount": 99, "desc": "NS5A inhibitor for HCV treatment"},
        {"name": "Hepcinat Plus", "generic_name": "Sofosbuvir/Daclatasvir", "brand": "Natco", "dosage": "400/60mg", "price": 28.00, "original_price": 850.00, "discount": 97, "desc": "Generic combination for HCV treatment"},
        {"name": "MyHep All", "generic_name": "Sofosbuvir/Velpatasvir", "brand": "Mylan", "dosage": "400/100mg", "price": 32.00, "original_price": 920.00, "discount": 97, "desc": "Affordable pan-genotypic HCV treatment"},
        {"name": "Velpanat", "generic_name": "Sofosbuvir/Velpatasvir", "brand": "Natco", "dosage": "400/100mg", "price": 30.00, "original_price": 890.00, "discount": 97, "desc": "Cost-effective HCV cure"},
        {"name": "Baraclude", "generic_name": "Entecavir", "brand": "BMS", "dosage": "0.5mg", "price": 8.00, "original_price": 380.00, "discount": 98, "desc": "First-line Hepatitis B treatment"},
        {"name": "Viread HBV", "generic_name": "Tenofovir", "brand": "Gilead", "dosage": "300mg", "price": 10.00, "original_price": 650.00, "discount": 98, "desc": "Hepatitis B treatment and prevention"},
        {"name": "Vemlidy", "generic_name": "Tenofovir Alafenamide", "brand": "Gilead", "dosage": "25mg", "price": 18.00, "original_price": 1200.00, "discount": 98, "desc": "Improved HBV treatment with bone/renal safety"},
        {"name": "Pegasys", "generic_name": "Peginterferon alfa-2a", "brand": "Roche", "dosage": "180mcg", "price": 85.00, "original_price": 420.00, "discount": 80, "desc": "Interferon therapy for hepatitis B and C"},
        {"name": "Hepsera", "generic_name": "Adefovir", "brand": "Gilead", "dosage": "10mg", "price": 12.00, "original_price": 580.00, "discount": 98, "desc": "Hepatitis B antiviral treatment"},
        {"name": "Resof Total", "generic_name": "Sofosbuvir/Velpatasvir", "brand": "Dr. Reddy's", "dosage": "400/100mg", "price": 35.00, "original_price": 950.00, "discount": 96, "desc": "Complete HCV treatment course"},
        {"name": "Sofovir", "generic_name": "Sofosbuvir", "brand": "Hetero", "dosage": "400mg", "price": 22.00, "original_price": 750.00, "discount": 97, "desc": "Generic sofosbuvir for HCV"},
        {"name": "Hepcvir", "generic_name": "Sofosbuvir", "brand": "Cipla", "dosage": "400mg", "price": 20.00, "original_price": 720.00, "discount": 97, "desc": "Quality generic HCV treatment"},
        {"name": "Myhep LVIR", "generic_name": "Ledipasvir/Sofosbuvir", "brand": "Mylan", "dosage": "90/400mg", "price": 42.00, "original_price": 1100.00, "discount": 96, "desc": "Generic Harvoni alternative"},
        {"name": "Ledifos", "generic_name": "Ledipasvir/Sofosbuvir", "brand": "Hetero", "dosage": "90/400mg", "price": 38.00, "original_price": 980.00, "discount": 96, "desc": "Affordable HCV genotype 1 treatment"},
    ]
    
    for med in hepatitis_meds:
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "hepatitis",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": "Tablet",
            "quantity_per_pack": 28,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400",
            "usage_instructions": ["Take after a light meal", "Do not break or crush tablets"],
            "side_effects": "Headache and nausea are common during early treatment.",
            "storage_info": "Store in a cool, dry place.",
            "rating": 4.8,
            "order_count": 95,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # ERECTILE DYSFUNCTION MEDICATIONS (20)
    ed_meds = [
        {"name": "Viagra", "generic_name": "Sildenafil Citrate", "brand": "Pfizer", "dosage": "100mg", "price": 2.50, "original_price": 70.00, "discount": 96, "desc": "Most prescribed ED medication worldwide"},
        {"name": "Cialis", "generic_name": "Tadalafil", "brand": "Lilly", "dosage": "20mg", "price": 3.00, "original_price": 75.00, "discount": 96, "desc": "Long-lasting ED treatment up to 36 hours"},
        {"name": "Levitra", "generic_name": "Vardenafil", "brand": "Bayer", "dosage": "20mg", "price": 3.50, "original_price": 65.00, "discount": 95, "desc": "Fast-acting ED medication"},
        {"name": "Stendra", "generic_name": "Avanafil", "brand": "Vivus", "dosage": "200mg", "price": 8.00, "original_price": 55.00, "discount": 85, "desc": "Fastest-acting ED medication (15 minutes)"},
        {"name": "Kamagra", "generic_name": "Sildenafil Citrate", "brand": "Ajanta", "dosage": "100mg", "price": 1.50, "original_price": 45.00, "discount": 97, "desc": "Popular generic Viagra alternative"},
        {"name": "Cenforce", "generic_name": "Sildenafil Citrate", "brand": "Centurion", "dosage": "100mg", "price": 1.20, "original_price": 42.00, "discount": 97, "desc": "Affordable sildenafil option"},
        {"name": "Fildena", "generic_name": "Sildenafil Citrate", "brand": "Fortune", "dosage": "100mg", "price": 1.30, "original_price": 40.00, "discount": 97, "desc": "Quality generic ED medication"},
        {"name": "Tadacip", "generic_name": "Tadalafil", "brand": "Cipla", "dosage": "20mg", "price": 2.00, "original_price": 55.00, "discount": 96, "desc": "Trusted generic Cialis"},
        {"name": "Tadarise", "generic_name": "Tadalafil", "brand": "Sunrise", "dosage": "20mg", "price": 1.80, "original_price": 50.00, "discount": 96, "desc": "Weekend pill alternative"},
        {"name": "Vidalista", "generic_name": "Tadalafil", "brand": "Centurion", "dosage": "20mg", "price": 1.50, "original_price": 48.00, "discount": 97, "desc": "Long-lasting generic tadalafil"},
        {"name": "Vilitra", "generic_name": "Vardenafil", "brand": "Centurion", "dosage": "20mg", "price": 2.20, "original_price": 52.00, "discount": 96, "desc": "Generic Levitra option"},
        {"name": "Suhagra", "generic_name": "Sildenafil Citrate", "brand": "Cipla", "dosage": "100mg", "price": 1.40, "original_price": 38.00, "discount": 96, "desc": "Reliable generic sildenafil"},
        {"name": "Penegra", "generic_name": "Sildenafil Citrate", "brand": "Zydus", "dosage": "100mg", "price": 1.60, "original_price": 42.00, "discount": 96, "desc": "Quality ED treatment option"},
        {"name": "Caverta", "generic_name": "Sildenafil Citrate", "brand": "Ranbaxy", "dosage": "100mg", "price": 1.55, "original_price": 40.00, "discount": 96, "desc": "Established generic Viagra"},
        {"name": "Silagra", "generic_name": "Sildenafil Citrate", "brand": "Cipla", "dosage": "100mg", "price": 1.45, "original_price": 39.00, "discount": 96, "desc": "Trusted sildenafil brand"},
        {"name": "Aurogra", "generic_name": "Sildenafil Citrate", "brand": "Aurochem", "dosage": "100mg", "price": 1.25, "original_price": 35.00, "discount": 96, "desc": "Affordable ED solution"},
        {"name": "Megalis", "generic_name": "Tadalafil", "brand": "Macleods", "dosage": "20mg", "price": 2.10, "original_price": 58.00, "discount": 96, "desc": "Weekend treatment option"},
        {"name": "Erectafil", "generic_name": "Tadalafil", "brand": "Combitic", "dosage": "20mg", "price": 1.90, "original_price": 52.00, "discount": 96, "desc": "Long-duration ED treatment"},
        {"name": "Super P-Force", "generic_name": "Sildenafil/Dapoxetine", "brand": "Sunrise", "dosage": "100/60mg", "price": 3.50, "original_price": 65.00, "discount": 95, "desc": "Dual-action for ED and PE"},
        {"name": "Extra Super Tadarise", "generic_name": "Tadalafil/Dapoxetine", "brand": "Sunrise", "dosage": "40/60mg", "price": 4.00, "original_price": 72.00, "discount": 94, "desc": "Enhanced dual-action formula"},
    ]
    
    for med in ed_meds:
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "ed",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": "Tablet",
            "quantity_per_pack": 10,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400",
            "usage_instructions": ["Take 30-60 minutes before activity", "Do not take more than once daily"],
            "side_effects": "Flushing, headache, and congestion may occur.",
            "storage_info": "Keep away from moisture and heat.",
            "rating": 4.6,
            "order_count": 500,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # DIABETES/INSULIN MEDICATIONS (20)
    diabetes_meds = [
        {"name": "Lantus", "generic_name": "Insulin Glargine", "brand": "Sanofi", "dosage": "100U/ml", "price": 45.00, "original_price": 350.00, "discount": 87, "desc": "Long-acting basal insulin for diabetes"},
        {"name": "Humalog", "generic_name": "Insulin Lispro", "brand": "Lilly", "dosage": "100U/ml", "price": 42.00, "original_price": 320.00, "discount": 87, "desc": "Rapid-acting mealtime insulin"},
        {"name": "NovoRapid", "generic_name": "Insulin Aspart", "brand": "Novo Nordisk", "dosage": "100U/ml", "price": 40.00, "original_price": 310.00, "discount": 87, "desc": "Fast-acting insulin for meals"},
        {"name": "Levemir", "generic_name": "Insulin Detemir", "brand": "Novo Nordisk", "dosage": "100U/ml", "price": 48.00, "original_price": 380.00, "discount": 87, "desc": "Long-acting insulin with predictable action"},
        {"name": "Tresiba", "generic_name": "Insulin Degludec", "brand": "Novo Nordisk", "dosage": "100U/ml", "price": 55.00, "original_price": 420.00, "discount": 87, "desc": "Ultra-long-acting basal insulin"},
        {"name": "Jardiance", "generic_name": "Empagliflozin", "brand": "Boehringer", "dosage": "25mg", "price": 8.00, "original_price": 480.00, "discount": 98, "desc": "SGLT2 inhibitor with cardiovascular benefits"},
        {"name": "Ozempic", "generic_name": "Semaglutide", "brand": "Novo Nordisk", "dosage": "1mg", "price": 85.00, "original_price": 950.00, "discount": 91, "desc": "Once-weekly GLP-1 for diabetes and weight"},
        {"name": "Trulicity", "generic_name": "Dulaglutide", "brand": "Lilly", "dosage": "1.5mg", "price": 75.00, "original_price": 820.00, "discount": 91, "desc": "Weekly GLP-1 receptor agonist"},
        {"name": "Victoza", "generic_name": "Liraglutide", "brand": "Novo Nordisk", "dosage": "1.8mg", "price": 65.00, "original_price": 680.00, "discount": 90, "desc": "Daily GLP-1 for blood sugar control"},
        {"name": "Metformin", "generic_name": "Metformin HCl", "brand": "Generic", "dosage": "500mg", "price": 0.80, "original_price": 25.00, "discount": 97, "desc": "First-line oral diabetes medication"},
        {"name": "Januvia", "generic_name": "Sitagliptin", "brand": "Merck", "dosage": "100mg", "price": 5.00, "original_price": 380.00, "discount": 99, "desc": "DPP-4 inhibitor for type 2 diabetes"},
        {"name": "Invokana", "generic_name": "Canagliflozin", "brand": "J&J", "dosage": "300mg", "price": 7.50, "original_price": 460.00, "discount": 98, "desc": "SGLT2 inhibitor for diabetes control"},
        {"name": "Farxiga", "generic_name": "Dapagliflozin", "brand": "AstraZeneca", "dosage": "10mg", "price": 6.50, "original_price": 420.00, "discount": 98, "desc": "SGLT2 inhibitor with heart/kidney benefits"},
        {"name": "Glucophage", "generic_name": "Metformin", "brand": "Merck", "dosage": "850mg", "price": 1.20, "original_price": 35.00, "discount": 97, "desc": "Extended-release metformin"},
        {"name": "Amaryl", "generic_name": "Glimepiride", "brand": "Sanofi", "dosage": "4mg", "price": 1.50, "original_price": 45.00, "discount": 97, "desc": "Sulfonylurea for type 2 diabetes"},
        {"name": "Trajenta", "generic_name": "Linagliptin", "brand": "Boehringer", "dosage": "5mg", "price": 4.50, "original_price": 350.00, "discount": 99, "desc": "DPP-4 inhibitor safe for kidney disease"},
        {"name": "Rybelsus", "generic_name": "Oral Semaglutide", "brand": "Novo Nordisk", "dosage": "14mg", "price": 95.00, "original_price": 980.00, "discount": 90, "desc": "First oral GLP-1 medication"},
        {"name": "Synjardy", "generic_name": "Empagliflozin/Metformin", "brand": "Boehringer", "dosage": "12.5/1000mg", "price": 12.00, "original_price": 520.00, "discount": 98, "desc": "Combination SGLT2 + metformin"},
        {"name": "Basaglar", "generic_name": "Insulin Glargine", "brand": "Lilly", "dosage": "100U/ml", "price": 38.00, "original_price": 280.00, "discount": 86, "desc": "Biosimilar long-acting insulin"},
        {"name": "Toujeo", "generic_name": "Insulin Glargine U-300", "brand": "Sanofi", "dosage": "300U/ml", "price": 52.00, "original_price": 400.00, "discount": 87, "desc": "Concentrated long-acting insulin"},
    ]
    
    for med in diabetes_meds:
        form = "Injection" if "Insulin" in med["generic_name"] or "glutide" in med["generic_name"] else "Tablet"
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "diabetes",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": form,
            "quantity_per_pack": 30 if form == "Tablet" else 1,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1593491034932-844ab981ed7c?w=400",
            "usage_instructions": ["Monitor glucose levels daily", "Rotate injection sites consistently"],
            "side_effects": "Hypoglycemia is possible; keep sugar source handy.",
            "storage_info": "Unopened insulin must be refrigerated.",
            "rating": 4.9,
            "order_count": 320,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # WEIGHT LOSS MEDICATIONS (20)
    weightloss_meds = [
        {"name": "Wegovy", "generic_name": "Semaglutide", "brand": "Novo Nordisk", "dosage": "2.4mg", "price": 125.00, "original_price": 1350.00, "discount": 91, "desc": "FDA-approved for chronic weight management"},
        {"name": "Saxenda", "generic_name": "Liraglutide", "brand": "Novo Nordisk", "dosage": "3mg", "price": 95.00, "original_price": 980.00, "discount": 90, "desc": "Daily injectable for weight loss"},
        {"name": "Mounjaro", "generic_name": "Tirzepatide", "brand": "Lilly", "dosage": "15mg", "price": 145.00, "original_price": 1200.00, "discount": 88, "desc": "Dual GIP/GLP-1 for diabetes and weight loss"},
        {"name": "Zepbound", "generic_name": "Tirzepatide", "brand": "Lilly", "dosage": "15mg", "price": 140.00, "original_price": 1150.00, "discount": 88, "desc": "FDA-approved tirzepatide for obesity"},
        {"name": "Qsymia", "generic_name": "Phentermine/Topiramate", "brand": "Vivus", "dosage": "15/92mg", "price": 45.00, "original_price": 280.00, "discount": 84, "desc": "Combination appetite suppressant"},
        {"name": "Contrave", "generic_name": "Naltrexone/Bupropion", "brand": "Nalpropion", "dosage": "8/90mg", "price": 35.00, "original_price": 250.00, "discount": 86, "desc": "Reduces cravings and appetite"},
        {"name": "Xenical", "generic_name": "Orlistat", "brand": "Roche", "dosage": "120mg", "price": 2.50, "original_price": 85.00, "discount": 97, "desc": "Fat absorption blocker"},
        {"name": "Alli", "generic_name": "Orlistat", "brand": "GSK", "dosage": "60mg", "price": 1.80, "original_price": 55.00, "discount": 97, "desc": "Over-the-counter weight loss aid"},
        {"name": "Phentermine", "generic_name": "Phentermine HCl", "brand": "Generic", "dosage": "37.5mg", "price": 1.50, "original_price": 45.00, "discount": 97, "desc": "Short-term appetite suppressant"},
        {"name": "Belviq", "generic_name": "Lorcaserin", "brand": "Eisai", "dosage": "10mg", "price": 8.00, "original_price": 220.00, "discount": 96, "desc": "Serotonin receptor agonist for weight"},
        {"name": "Rybelsus WL", "generic_name": "Oral Semaglutide", "brand": "Novo Nordisk", "dosage": "14mg", "price": 98.00, "original_price": 950.00, "discount": 90, "desc": "Oral GLP-1 for weight management"},
        {"name": "Adipex-P", "generic_name": "Phentermine", "brand": "Teva", "dosage": "37.5mg", "price": 2.00, "original_price": 52.00, "discount": 96, "desc": "Brand-name appetite suppressant"},
        {"name": "Lomaira", "generic_name": "Phentermine", "brand": "KVK Tech", "dosage": "8mg", "price": 1.20, "original_price": 38.00, "discount": 97, "desc": "Low-dose phentermine option"},
        {"name": "Didrex", "generic_name": "Benzphetamine", "brand": "Pfizer", "dosage": "50mg", "price": 3.50, "original_price": 85.00, "discount": 96, "desc": "Anorectic agent for weight loss"},
        {"name": "Tenuate", "generic_name": "Diethylpropion", "brand": "Generic", "dosage": "75mg", "price": 2.80, "original_price": 72.00, "discount": 96, "desc": "Appetite suppressant stimulant"},
        {"name": "Bontril", "generic_name": "Phendimetrazine", "brand": "Valeant", "dosage": "105mg", "price": 3.20, "original_price": 78.00, "discount": 96, "desc": "Extended-release appetite suppressant"},
        {"name": "Plenity", "generic_name": "Cellulose/Citric Acid", "brand": "Gelesis", "dosage": "2.25g", "price": 4.00, "original_price": 98.00, "discount": 96, "desc": "Hydrogel that promotes fullness"},
        {"name": "Imcivree", "generic_name": "Setmelanotide", "brand": "Rhythm", "dosage": "10mg/ml", "price": 350.00, "original_price": 4500.00, "discount": 92, "desc": "For genetic obesity disorders"},
        {"name": "Zonisamide", "generic_name": "Zonisamide", "brand": "Generic", "dosage": "100mg", "price": 1.50, "original_price": 42.00, "discount": 96, "desc": "Off-label use for weight loss"},
        {"name": "Topiramate", "generic_name": "Topiramate", "brand": "Generic", "dosage": "100mg", "price": 0.90, "original_price": 35.00, "discount": 97, "desc": "Off-label appetite suppressant"},
    ]
    
    for med in weightloss_meds:
        form = "Injection" if "glutide" in med["generic_name"].lower() or "Tirzepatide" in med["generic_name"] else "Tablet"
        products_data.append({
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": med["name"],
            "generic_name": med["generic_name"],
            "brand": med["brand"],
            "category": "weightloss",
            "description": med["desc"],
            "dosage": med["dosage"],
            "form": form,
            "quantity_per_pack": 30 if form == "Tablet" else 4,
            "price": med["price"],
            "original_price": med["original_price"],
            "discount_percentage": med["discount"],
            "manufacturer": med["brand"],
            "requires_prescription": True,
            "in_stock": True,
            "image_url": "https://images.unsplash.com/photo-1573883431205-98b5f10aaedb?w=400",
            "usage_instructions": ["Inject once weekly", "Follow calorie-controlled diet"],
            "side_effects": "Stomach upset and nausea are common at start.",
            "storage_info": "Refrigerate (2-8°C). Do not freeze.",
            "rating": 4.8,
            "order_count": 450,
            "additional_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Insert all products
    await db.products.insert_many(products_data)
    
    # Seed testimonials
    testimonials_data = [
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "Robert Mitchell",
            "country": "United States",
            "rating": 5,
            "comment": "I've been ordering my cancer medication from MediSeller for over 2 years. The savings are incredible - over $2,000 per month! The quality is exactly the same as what I was getting at my local pharmacy. Fast shipping and excellent customer support.",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "Sarah Thompson",
            "country": "United Kingdom",
            "rating": 5,
            "comment": "Finding affordable Hepatitis C treatment seemed impossible until I found MediSeller. They helped me get the same medications at 99% less cost. Their expert team guided me through the entire process. Forever grateful!",
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "Michael Chen",
            "country": "Canada",
            "rating": 5,
            "comment": "The diabetes medications I need cost a fortune in Canada. MediSeller delivers authentic products at a fraction of the price. Delivery took 10 days and everything was perfectly packaged. Highly recommend!",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "Emma Wilson",
            "country": "Australia",
            "rating": 5,
            "comment": "As someone on HIV medication for life, the cost savings from MediSeller are life-changing. Same Gilead medications, authentic and effective, at prices I can actually afford. Their discreet packaging is also much appreciated.",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "James Rodriguez",
            "country": "Germany",
            "rating": 5,
            "comment": "Excellent service from start to finish. The consultation team helped me find the right weight loss medication and explained everything clearly. The medication arrived quickly and has been very effective.",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "testimonial_id": f"test_{uuid.uuid4().hex[:8]}",
            "name": "Linda Martinez",
            "country": "Spain",
            "rating": 5,
            "comment": "45 years of experience really shows. MediSeller's team is professional, knowledgeable, and genuinely caring. They made getting my husband's cancer medication stress-free during an already difficult time.",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    
    await db.testimonials.insert_many(testimonials_data)
    
    # Seed Users (Customers)
    users_data = []
    customer_ids = []
    for i in range(5):
        u_id = f"user_{uuid.uuid4().hex[:8]}"
        customer_ids.append(u_id)
        users_data.append({
            "user_id": u_id,
            "name": f"Test Customer {i+1}",
            "email": f"customer{i+1}@example.com",
            "password": "hashed_password", # placeholder
            "role": "customer",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=i*2)).isoformat()
        })
    await db.users.insert_many(users_data)

    # Seed Orders
    orders_data = []
    for i in range(12):
        o_id = f"ORD-{uuid.uuid4().hex[:6].upper()}"
        cust_id = customer_ids[i % len(customer_ids)]
        date = (datetime.now(timezone.utc) - timedelta(days=i//2)).isoformat()
        orders_data.append({
            "order_id": o_id,
            "user_id": cust_id,
            "status": "delivered" if i < 8 else "pending",
            "total": 150.0 + (i * 20),
            "currency": "USD",
            "items": [{"product_id": "test", "quantity": 1, "price": 150.0}],
            "shipping_address": {"full_name": f"Test Customer {i%5+1}", "email": "test@example.com"},
            "subtotal": 135.0,
            "shipping_cost": 15.0,
            "created_at": date
        })
    await db.orders.insert_many(orders_data)

    # Seed Coupons
    coupons_data = [
        {"coupon_id": "c1", "code": "WELCOME10", "discount_type": "percentage", "value": 10.0, "active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"coupon_id": "c2", "code": "FREESHIP", "discount_type": "fixed", "value": 15.0, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.coupons.insert_many(coupons_data)

    # Seed Blog Posts
    posts_data = [
        {
            "post_id": "p1",
            "title": "5 Tips for Managing Diabetes Naturally",
            "slug": "diabetes-management-tips",
            "summary": "Learn how small lifestyle changes can make a big difference in blood sugar control.",
            "content": "Full content about diabetes management...",
            "author": "Dr. Smith",
            "image_url": "https://images.unsplash.com/photo-1505751172107-1675239a099a?w=800",
            "published": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "post_id": "p2",
            "title": "Understanding HIV Treatment in 2026",
            "slug": "hiv-treatment-2026",
            "summary": "An overview of modern antiretroviral therapies and their effectiveness.",
            "content": "Detailed overview of modern ART...",
            "author": "MediSeller Team",
            "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
            "published": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.posts.insert_many(posts_data)
    
    # Seed site configuration
    existing_config = await db.site_config.count_documents({"active": True})
    if existing_config == 0:
        default_config = {
            "active": True,
            "seo": {
                "title": "MediSeller - Authentic Generic Medications Online",
                "description": "Save up to 90% on life-saving medications. Certified global exporter of authentic oncology, HIV, and Hepatitis medicines.",
                "keywords": "generic medicine, buy medicine online, cancer medications, HIV treatment"
            },
            "shipping": {
                "base_cost": 15.0,
                "free_threshold": 1000.0,
                "tax_rate": 0.0
            },
            "header": {
                "logo_text": "MediSeller",
                "nav_items": [
                    {"label": "Categories", "path": "/products#categories"},
                    {"label": "All Products", "path": "/products"},
                    {"label": "Expert Consultation", "path": "/consultation"},
                    {"label": "About Us", "path": "/about"}
                ]
            },
            "hero": {
                "badge": "45+ Years of Heritage",
                "title": "Global Access to Authentic Medicine",
                "subtitle": "Secure 100% original generic medications from India. Save over 60% with insured delivery to 30+ countries. Trusted by patients worldwide for nearly half a century.",
                "primary_cta": {"text": "View All Products", "path": "/products"},
                "secondary_cta": {"text": "Talk to Expert", "path": "/consultation"},
                "image_url": "https://images.unsplash.com/photo-1576091358783-a212ec293ff3?w=800",
                "background_image_url": None,
                "patients_count": "150K+",
                "rating": 4.9,
                "trust_avatars": [
                    "https://i.pravatar.cc/100?img=11",
                    "https://i.pravatar.cc/100?img=12",
                    "https://i.pravatar.cc/100?img=13",
                    "https://i.pravatar.cc/100?img=14"
                ],
                "floating_card_title": "100% Authentic",
                "floating_card_subtitle": "Verified Products",
                "floating_card_icon": "CheckCircle",
                "savings_badge_percentage": "60%",
                "savings_badge_text": "Average Savings"
            },
            "stats": {
                "items": [
                    {"value": "45+", "label": "Years of Excellence"},
                    {"value": "30+", "label": "Countries Served"},
                    {"value": "150K+", "label": "Happy Customers"},
                    {"value": "99%", "label": "Delivery Rate"}
                ]
            },
            "categories_section": {
                "badge": "Browse by Category",
                "title": "Life-Saving & Lifestyle Medications",
                "subtitle": "We specialize in affordable generic medications for serious health conditions. All products are sourced from licensed manufacturers.",
                "cards": [
                    {"title": "Cancer Medications", "slug": "cancer", "subtitle": "Life-saving oncology treatments", "icon_name": "Ribbon", "color_class": "from-pink-500/10 to-pink-500/5", "path": "/products?category=cancer"},
                    {"title": "HIV/AIDS Treatment", "slug": "hiv", "subtitle": "Antiretroviral therapies", "icon_name": "Activity", "color_class": "from-purple-500/10 to-purple-500/5", "path": "/products?category=hiv"},
                    {"title": "Hepatitis", "slug": "hepatitis", "subtitle": "Cure hepatitis C in 12 weeks", "icon_name": "ShieldAlert", "color_class": "from-teal-500/10 to-teal-500/5", "path": "/products?category=hepatitis"},
                    {"title": "Erectile Dysfunction", "slug": "ed", "subtitle": "Trusted ED medications", "icon_name": "Zap", "color_class": "from-blue-500/10 to-blue-500/5", "path": "/products?category=ed"},
                    {"title": "Diabetes & Insulin", "slug": "diabetes", "subtitle": "Insulin and oral medications", "icon_name": "Stethoscope", "color_class": "from-orange-500/10 to-orange-500/5", "path": "/products?category=diabetes"},
                    {"title": "Weight Loss", "slug": "weightloss", "subtitle": "FDA-approved solutions", "icon_name": "Scale", "color_class": "from-green-500/10 to-green-500/5", "path": "/products?category=weightloss"}
                ]
            },
            "how_it_works": {
                "badge": "How It Works",
                "title": "Simple 4-Step Process",
                "subtitle": "Getting your medications delivered is easy. Follow these simple steps to start saving.",
                "steps": [
                    {"step": "1", "title": "Browse Products", "description": "Find the medications you need from our extensive catalog."},
                    {"step": "2", "title": "Upload Prescription", "description": "Our pharmacists verify your prescription for safety."},
                    {"step": "3", "title": "Secure Payment", "description": "Pay securely using various international methods."},
                    {"step": "4", "title": "Global Delivery", "description": "Receive your medication at your doorstep in 7-14 days."}
                ]
            },
            "testimonials": {
                "badge": "Customer Stories",
                "title": "What Our Customers Say",
                "subtitle": "Trusted by thousands of patients worldwide. Here's what they have to say about us.",
                "items": [
                    {
                        "name": "Robert Mitchell",
                        "country": "United States",
                        "comment": "The savings are incredible - over $2,000 per month! The quality is exactly the same as what I was getting at my local pharmacy.",
                        "rating": 5,
                        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                    },
                    {
                        "name": "Sarah Thompson",
                        "country": "United Kingdom",
                        "comment": "Helping me get Hep C medications at 99% less cost. Forever grateful for the support and guidance throughout the process.",
                        "rating": 5,
                        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
                    }
                ]
            },
            "faq": {
                "badge": "FAQ",
                "title": "Frequently Asked Questions",
                "items": [
                    {"question": "Are the medications real?", "answer": "Yes, we only source from FDA-approved Indian manufacturers."},
                    {"question": "How long does shipping take?", "answer": "Usually 7-14 business days globally."},
                    {"question": "Do I need a prescription?", "answer": "Yes, for all prescription-only medications, a valid RX is required."}
                ]
            },
            "price_comparison": {
                "badge_text": "Massive Savings",
                "title": "Save Up to 90% on Life-Saving Medications",
                "subtitle": "Compare our prices with international brand names. We provide the same active ingredients at a fraction of the cost.",
                "banner_title": "Why Such a Huge Price Difference?",
                "banner_text": "US pharmaceutical companies hold patents that allow them to set monopoly prices. Indian law permits licensed manufacturers to produce bioequivalent generics once patents expire or through compulsory licensing. These generics contain the same active pharmaceutical ingredients (API), undergo rigorous quality testing, and are approved by WHO, FDA, and other global regulatory bodies.",
                "us_annual_label": "US yearly cost",
                "us_annual_cost": 144000.0,
                "india_annual_label": "India generic yearly cost",
                "india_annual_cost": 540.0,
                "shipping_annual_label": "Shipping included",
                "shipping_annual_cost": 180.0,
                "savings_label": "Total Annual Savings",
                "savings_footer": "Per year on a single medication",
                "rows": [
                    {"medication": "Gleevec (Imatinib) 400mg", "brand_price": "$2,850", "mediseller_price": "$45", "savings": "98%"},
                    {"medication": "Revlimid (Lenalidomide) 25mg", "brand_price": "$890", "mediseller_price": "$85", "savings": "90%"},
                    {"medication": "Sovaldi (Sofosbuvir) 400mg", "brand_price": "$12,000", "mediseller_price": "$180", "savings": "98%"}
                ],
                "trust_indicators": [
                    {"title": "FDA Approved Facilities", "description": "WHO-GMP certified manufacturers", "icon": "Check"},
                    {"title": "Bioequivalent Formulas", "description": "Same active ingredients & efficacy", "icon": "Check"},
                    {"title": "Quality Guaranteed", "description": "Batch testing & verification", "icon": "Check"}
                ]
            },
            "prescription_cta": {
                "badge": "Prescription Required",
                "title": "Have a Prescription?",
                "subtitle": "Upload your prescription and our expert pharmacists will verify it within 24 hours. Or connect with our team on WhatsApp for instant assistance with your medication needs.",
                "text": "Getting your medications delivered is easy. Follow these simple steps to start saving.",
                "button_text": "Upload Prescription Now",
                "steps": [
                    {"title": "Upload Your Prescription", "description": "JPEG, PNG, PDF - max 10MB"},
                    {"title": "Expert Verification", "description": "Our pharmacists review within 24 hours"},
                    {"title": "Complete Your Order", "description": "Get best prices with doorstep delivery"}
                ],
                "card_title": "Connect with Our Experts",
                "card_subtitle": "Get instant help via WhatsApp - available 24/7",
                "card_features": [
                    {"title": "Quick Response", "description": "Get replies within minutes, not hours", "icon": "Clock"},
                    {"title": "Expert Guidance", "description": "Licensed pharmacists help you find the right medication", "icon": "Shield"},
                    {"title": "Prescription Help", "description": "We can help source hard-to-find medications", "icon": "FileText"}
                ],
                "whatsapp_number": "+1 (234) 567-890",
                "whatsapp_cta_text": "Message Us on WhatsApp"
            },
            "whatsapp_communities": {
                "badge": "WhatsApp Communities",
                "title": "Join Our Medical Communities",
                "subtitle": "Connect with thousands of patients worldwide. Get exclusive offers, new product alerts, and be the first to know about flash sales and discounts.",
                "bottom_text": "Turn on notifications to never miss a deal!",
                "communities": [
                    {"title": "Oncology Support", "description": "Connect with other cancer patients and experts.", "link": "#", "icon": "Ribbon"},
                    {"title": "Global Pharmacy Updates", "description": "Get news on new medications and availability.", "link": "#", "icon": "Globe"}
                ]
            },
            "bottom_cta": {
                "title": "Need Help Finding Your Medication?",
                "text": "Our expert pharmacists are available 24/7 to help you find the right medications at the best prices.",
                "primary_button": {"text": "Request Consultation", "path": "/consultation"},
                "secondary_button": {"text": "Contact Us", "path": "/contact"}
            },
            "products_page": {
                "title": "All Medications",
                "subtitle": "Browse our selection of authentic generic medications at affordable prices"
            },
            "product_categories": ["Cancer", "HIV/AIDS", "Hepatitis", "Erectile Dysfunction", "Diabetes & Insulin", "Weight Loss", "Fertility", "Other"],
            "about_page": {
                "hero_badge": "45+ Years of Excellence",
                "hero_title": "Trusted Pharmaceutical Partner Since 1981",
                "hero_subtitle": "MediSeller has been at the forefront of pharmaceutical distribution for over four decades, connecting patients with affordable, authentic medications.",
                "mission_title": "Our Mission",
                "mission_text": "To make life-saving medications accessible and affordable to patients worldwide. We believe health is a human right, not a privilege.",
                "vision_title": "Our Vision",
                "vision_text": "To become the most trusted global online pharmacy, known for authenticity, affordability, and excellent customer care.",
                "stats": [
                    {"value": "45+", "label": "Years Experience"},
                    {"value": "150K+", "label": "Patients Served"},
                    {"value": "30+", "label": "Countries"},
                    {"value": "99%", "label": "Delivery Rate"}
                ],
                "advantage_section": {
                    "title": "The MediSeller Advantage",
                    "subtitle": "What sets us apart in the pharmaceutical distribution industry",
                    "cards": [
                        {"title": "100% Authentic Products", "description": "Directly sourced from licensed manufacturers.", "icon_name": "Shield"},
                        {"title": "Global Delivery", "description": "Express air shipping to over 30 countries.", "icon_name": "Truck"},
                        {"title": "60%+ Savings", "description": "Significant cost savings on quality generic alternatives.", "icon_name": "Award"}
                    ]
                },
                "compliance_section": {
                    "title": "Licensed & Certified",
                    "subtitle": "MediSeller (A Unit of Medicare) is a government-certified global exporter.",
                    "gst_number": "07AAIPG2896A1ZV",
                    "iec_code": "0514067152"
                },
                "bottom_cta": {
                    "title": "Ready to Get Started?",
                    "text": "Browse our catalog of authentic medications today.",
                    "primary_button": {"text": "Browse Products", "path": "/products"},
                    "secondary_button": {"text": "Talk to Expert", "path": "/consultation"}
                },
                "timeline_title": "Our Journey",
                "timeline_subtitle": "45+ years of growth, trust, and commitment to patient care",
                "timeline": [
                    {"year": "1981", "event": "Founded in Chandni Chowk, New Delhi"},
                    {"year": "1995", "event": "Started international distribution"},
                    {"year": "2005", "event": "Reached 50,000 patients served"},
                    {"year": "2015", "event": "Expanded to 20+ countries"},
                    {"year": "2024", "event": "Serving 150,000+ patients worldwide"}
                ]
            },
            "contact_page": {
                "hero_title": "Contact Us",
                "hero_subtitle": "Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.",
                "address": "No. 1520/110, First Floor, Jagson Pal Building, Bhagirath Palace, Chandni Chowk, New Delhi - 110006",
                "phone": "+1 (234) 567-890",
                "email": "support@mediseller.com",
                "business_hours": [
                    "Monday - Friday: 9:00 AM - 6:00 PM IST",
                    "Saturday: 10:00 AM - 4:00 PM IST",
                    "Sunday: Closed"
                ],
                "whatsapp_number": "1234567890",
                "whatsapp_title": "WhatsApp Support",
                "whatsapp_description": "Get instant support via WhatsApp for quick queries and order updates."
            },
            "footer": {
                "brand_description": "MediSeller (A Unit of Medicare) is a government-certified global exporter and wholesaler of authentic pharmaceutical products.",
                "social_links": [
                    {"platform": "Facebook", "url": "https://facebook.com"},
                    {"platform": "Twitter", "url": "https://twitter.com"},
                    {"platform": "LinkedIn", "url": "https://linkedin.com"}
                ],
                "footer_links": [
                    {"label": "Privacy Policy", "path": "/privacy"},
                    {"label": "Terms of Service", "path": "/terms"},
                    {"label": "Refund Policy", "path": "/refund"}
                ],
                "links": [
                    {
                        "title": "Categories",
                        "items": [
                            {"title": "Cancer Medications", "path": "/products?category=Cancer"},
                            {"title": "HIV/AIDS Treatment", "path": "/products?category=HIV"},
                            {"title": "Hepatitis", "path": "/products?category=Hepatitis"}
                        ]
                    },
                    {
                        "title": "Quick Links",
                        "items": [
                            {"title": "About Us", "path": "/about"},
                            {"title": "All Products", "path": "/products"},
                            {"title": "Expert Consultation", "path": "/consultation"},
                            {"title": "Contact Us", "path": "/contact"}
                        ]
                    }
                ]
            },
            "manufacturers": [
                "Sun Pharma", "Cipla", "Dr. Reddy's", "Lupin", "Aurobindo", 
                "Zydus", "Torrent", "Biocon", "Glenmark", "Hetero",
                "Pfizer", "Novartis", "Roche", "Gilead", "Merck"
            ],
            "top_bar_text": "45+ Years of Trusted Service | 30+ Countries | 100% Authentic Medications",
            "top_bar_phone": "+1 (234) 567-890",
            "compliance_notice": "MediSeller is a licensed pharmaceutical distributor. All medications require a valid prescription. We comply with international pharmaceutical regulations and Indian pharmacy laws. Products are sourced from licensed manufacturers and undergo quality verification. Please consult your healthcare provider before starting any medication.",
            "legal_pages": {
                "privacy_policy": {
                    "title": "Privacy Policy",
                    "last_updated": "March 24, 2026",
                    "content": """# Privacy Policy

**Last Updated:** March 24, 2026

At MediSeller (A Unit of Medicare), we understand that your health information is deeply personal. We are committed to protecting your privacy and ensuring the security of the data you share with us. This Privacy Policy details the types of information we collect, how we use it, and the stringent measures we take to safeguard your confidential data in accordance with international pharmaceutical regulations.

## 1. Information We Collect
To provide our global pharmaceutical services and ensure your safety, we collect the following types of information:
- **Personal Identification:** Full name, shipping address, billing address, email address, and telephone number for order verification and delivery.
- **Medical Documentation:** Valid prescriptions as required by international and Indian pharmacy laws for the dispensing of prescription-only medications.
- **Transaction Details:** Records of products purchased, order status, and payment confirmation (processed securely through encrypted gateways; we do not store full card numbers).
- **Technical Data:** IP address, browser type, and usage patterns collected via cookies to improve our website experience and prevent fraud.

## 2. How We Use Your Information
We utilize the collected data strictly for the following professional purposes:
- **Order Fulfillment:** Processing your orders, coordinating global logistics via partners like FedEx and DHL, and managing doorstep delivery.
- **Prescription Verification:** Our licensed pharmacists review every prescription to ensure authenticity and patient safety.
- **Customer Support:** Providing 24/7 assistance, answering product queries, and sending order tracking updates via email and WhatsApp.
- **Security & Compliance:** Preventing fraudulent transactions and complying with international pharmaceutical export-import regulations.

## 3. Data Protection and Security
We implement industry-leading security protocols to protect your sensitive data:
- **Encryption:** All data transmission is secured using 256-bit SSL (Secure Socket Layer) encryption.
- **Secure Firewalls:** Our servers are protected by advanced firewalls and intrusion detection systems.
- **Restricted Access:** Access to medical documentation is strictly limited to authorized pharmacists and quality control personnel.

## 4. Third-Party Data Sharing
We **never** sell, trade, or rent your personal or medical data to third parties for marketing purposes. Data is only shared with:
- **Authorized Logistics Partners:** Strictly for the purpose of shipping and delivery.
- **Regulatory Authorities:** Only when legally mandated by pharmaceutical governing bodies or by court order.

## 5. Cookies and Tracking
We use cookies to enhance your browsing experience, remember your currency preferences (INR/USD), and analyze site traffic. You can manage your cookie settings through your browser at any time.

## 6. Your Legal Rights
You have the right to access, update, or request the deletion of your personal data. To exercise these rights, please contact our Data Protection Officer at support@mediseller.com. We respond to all privacy-related inquiries within 48 business hours."""
                },
                "terms_of_service": {
                    "title": "Terms of Service",
                    "last_updated": "March 24, 2026",
                    "content": """# Terms of Service

**Last Updated:** March 24, 2026

Welcome to MediSeller. By accessing our platform and utilizing our services, you agree to be bound by the following terms and conditions. These terms ensure a safe, legal, and professional experience for all our global patients.

## 1. Professional Medical Disclaimer
MediSeller (A Unit of Medicare) is a licensed pharmaceutical exporter and wholesaler. All content provided on this website, including text, graphics, and product descriptions, is for informational purposes only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider before starting, stopping, or altering any medication or health regimen.

## 2. Prescription Requirements
All medications labeled as 'Prescription Only' require a valid prescription written by a licensed medical practitioner in your country of residence. 
- **Verification:** Our pharmacists will manually verify every uploaded prescription.
- **Order Cancellation:** MediSeller reserves the right to cancel any order if a valid, legible prescription is not provided within 72 hours of order placement.

## 3. Shipping, Customs, and Importation
- **Global Shipping:** We ship globally using reliable express air couriers. Delivery times are estimates (typically 7-14 business days).
- **Import Responsibility:** The patient/buyer is solely responsible for ensuring the medication is legal for import into their home country. 
- **Duties and Taxes:** Any local customs duties, VAT, or import taxes are the responsibility of the buyer and must be paid to local authorities directly if applicable.

## 4. Limitation of Liability
While MediSeller ensures all products are sourced directly from WHO-GMP certified and licensed manufacturers, we are not liable for:
- **Adverse Reactions:** Any physical reactions or side effects resulting from the use of medications.
- **Shipping Delays:** Delays caused by customs clearance or international postal services.
- **Confiscation:** Any items seized by local customs authorities due to import restrictions.

## 5. Intellectual Property
All website content, including the Mediseller logo, design, and product listings, are the intellectual property of MediSeller (A Unit of Medicare) and may not be reproduced without written consent.

## 6. Governing Law
These terms are governed by the laws of India. Any disputes arising from the use of this website shall be subject to the exclusive jurisdiction of the courts in Delhi, India."""
                },
                "refund_policy": {
                    "title": "Refund Policy",
                    "last_updated": "March 24, 2026",
                    "content": """# Refund and Return Policy

**Last Updated:** March 24, 2026

At MediSeller, we maintain the highest standards of quality and patient safety. Due to the sensitive nature of pharmaceutical products and strict international health regulations, our return and refund policy is clearly defined.

## 1. No-Returns Policy
As per strict international pharmaceutical safety standards, we **cannot accept returns** of any medication once it has left our temperature-controlled facility. This policy ensures that every patient receives 100% authentic, un-tampered, and safely stored medication. We cannot guarantee the storage conditions of a product once it leaves our sight, hence returns are strictly prohibited to protect public health.

## 2. Order Cancellation Policy
- **Before Dispatch:** Orders can be cancelled for a full refund if the cancellation request is received **before** the order has been handed over to the courier.
- **After Dispatch:** Once an order is in the hands of the international logistics partner, it cannot be cancelled or refunded.

## 3. 100% Satisfaction Guarantee: Refund or Reshipment
We want you to feel secure in your purchase. MediSeller will issue a full refund or provide a free replacement only under the following specific circumstances:
- **Incorrect Order:** The product received does not match your confirmed order receipt.
- **Damaged in Transit:** The product arrives with visible damage to the primary seal or packaging that compromises the medication's integrity (proof required).
- **Lost Package:** The courier officially confirms the package is lost and cannot be delivered after the maximum estimation period.

## 4. Claims Submissions
To initiate a claim, you must contact us at support@mediseller.com within **7 days** of the delivery date. Please include:
- Your Order Number.
- Clear photographs of the shipping label and the damaged/incorrect product.
- A brief description of the discrepancy.

## 5. Refund Processing
Approved refunds are processed to the original payment method within 5-10 business days. Please note that bank processing times may vary."""
                }
            },
            "favicon_url": "https://mediseller.com/favicon.ico",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.site_config.insert_one(default_config)
    
    return {
        "message": "Database seeded successfully",
        "products": len(products_data),
        "testimonials": len(testimonials_data)
    }

# Image Upload Endpoint
@api_router.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Create a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the public URL
        # For production, we should ideally use the actual domain, but for now we fallback
        base_url = os.environ.get("BASE_URL", "http://localhost:8001")
        return {"url": f"{base_url}/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

@app.on_event("startup")
async def startup_db_seed():
    """Auto-seed site config on startup if empty"""
    try:
        # Ensure indexes for performance
        if not USE_MOCK_DB:
            await db.products.create_index("product_id", unique=True)
            await db.products.create_index("category")
            await db.users.create_index("user_id", unique=True)
            await db.users.create_index("email", unique=True)
            await db.orders.create_index("order_id", unique=True)
            await db.site_config.create_index("active")
            logger.info("Database indexes verified/created")

        config_count = await db.site_config.count_documents({"active": True})
        prod_count = await db.products.count_documents({})
        if config_count == 0 or prod_count == 0:
            logger.info("Site data or config missing. Auto-seeding...")
            await seed_database()
            logger.info("Database auto-seeded successfully")
    except Exception as e:
        logger.error(f"Auto-seeding failed on startup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if not USE_MOCK_DB:
        try:
            mongo_client.close()
        except NameError:
            pass

if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable if available (for Render/Cloud), otherwise default to 8001
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
