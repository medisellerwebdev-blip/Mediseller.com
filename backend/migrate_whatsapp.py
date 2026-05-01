import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# We import SiteConfig to get the default values
# But since we can't easily import from server.py due to dependencies, we'll redefine the defaults here

DEFAULTS = {
    "badge": "WhatsApp Communities",
    "title": "Join Our WhatsApp Communities",
    "subtitle": "Connect with thousands of patients worldwide. Get exclusive offers, new product alerts, and be the first to know about flash sales and discounts.",
    "bottom_text": "Turn on notifications to never miss a deal!",
    "communities": [
        {"name": "Cancer Support Community", "description": "Get updates on cancer medications, new treatments, and exclusive discounts", "members": "5,000+", "link": "https://chat.whatsapp.com/cancer-community", "color": "bg-rose-500", "icon": "Heart"},
        {"name": "HIV/AIDS Support", "description": "Connect with others, get medication updates and special pricing alerts", "members": "3,500+", "link": "https://chat.whatsapp.com/hiv-community", "color": "bg-purple-500", "icon": "Pill"},
        {"name": "Hepatitis Cure Community", "description": "Updates on HCV treatments, success stories, and member-only offers", "members": "4,200+", "link": "https://chat.whatsapp.com/hepatitis-community", "color": "bg-emerald-500", "icon": "Activity"},
        {"name": "Diabetes & Insulin Group", "description": "Insulin deals, diabetes management tips, and new product launches", "members": "8,000+", "link": "https://chat.whatsapp.com/diabetes-community", "color": "bg-amber-500", "icon": "Zap"},
        {"name": "Weight Loss Journey", "description": "Wegovy, Ozempic updates, transformation stories, and exclusive offers", "members": "6,500+", "link": "https://chat.whatsapp.com/weight-loss", "color": "bg-green-500", "icon": "Activity"},
        {"name": "MediSeller Deals & Offers", "description": "Flash sales, new arrivals, and exclusive discount codes for all medications", "members": "12,000+", "link": "https://chat.whatsapp.com/deals", "color": "bg-rose-600", "icon": "Gift"}
    ]
}

async def migrate():
    load_dotenv(dotenv_path="c:/Users/DELHI/Desktop/Mediseller 2.0 website/backend/.env")
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    
    print(f"Connecting to DB: {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if config exists
    config = await db.site_config.find_one({"active": True})
    if config:
        print("Updating existing WhatsApp Communities config...")
        await db.site_config.update_one(
            {"active": True},
            {"$set": {"whatsapp_communities": DEFAULTS}}
        )
        print("Update successful!")
    else:
        print("No active site_config found. Creating one with defaults...")
        # Note: This is a partial config, might cause issues if other fields are missing
        # But usually there should be a config if the site is running
        await db.site_config.insert_one({
            "active": True,
            "whatsapp_communities": DEFAULTS
        })
        print("Creation successful!")

if __name__ == "__main__":
    try:
        asyncio.run(migrate())
    except Exception as e:
        print(f"Error: {e}")
