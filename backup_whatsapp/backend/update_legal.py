import requests

PRIVACY = """# Privacy Policy

**Last Updated:** March 24, 2026

At MediSeller (A Unit of Medicare), your privacy and security are our highest priorities. This Privacy Policy details the information we collect, how it is used, and the measures we take to protect your confidential data.

## 1. Information We Collect
- **Personal Information:** Name, shipping address, email address, phone number.
- **Medical Information:** Valid prescriptions required for controlled medications, as mandated by international pharmacy laws.
- **Payment Information:** Securely processed via third-party gateways. We do not store full credit card details on our servers.

## 2. How We Use Your Data
- To process and fulfill your global medication orders.
- To verify the authenticity and legality of prescriptions.
- To provide tracking updates and 24/7 customer support.

## 3. Data Protection and Sharing
We implement industry-standard SSL encryption and secure firewalls. We **do not** sell, trade, or rent your personal or medical data to third parties. Information is only shared with authorized logistics partners (e.g., FedEx, DHL) strictly for delivery purposes, or when legally required by regulatory authorities.
"""

TERMS = """# Terms of Service

**Last Updated:** March 24, 2026

Welcome to MediSeller. By accessing our platform and placing an order, you agree to comply with the following international terms.

## 1. Professional Medical Advice
MediSeller is a licensed global pharmaceutical distributor. The content on this website does not substitute professional medical advice. Always consult your healthcare provider before starting, stopping, or altering any medication.

## 2. Prescription Requirements
All prescription medications require a valid prescription written by a licensed medical practitioner in your country of residence. Orders submitted without valid prescriptions will be strictly cancelled.

## 3. Shipping and Customs
- We ship globally using reliable logistics partners. Delivery times are estimates (typically 7-14 business days).
- **Import Duties & Customs:** The buyer is solely responsible for ensuring the medication complies with home country import regulations. Any customs duties, taxes, or clearance delays are the responsibility of the buyer.

## 4. Limitation of Liability
MediSeller ensures all products are sourced directly from WHO-GMP certified manufacturers. However, we are not liable for adverse physical reactions, misuse of medications, or shipping delays caused by local authorities.
"""

REFUND = """# Refund and Return Policy

**Last Updated:** March 24, 2026

At MediSeller, we maintain strict quality control standards. Due to the sensitive nature of pharmaceutical products and international health regulations, our return policy is strictly defined.

## 1. Order Cancellations
Orders can be cancelled for a full refund if the cancellation request is received **before** the order has been dispatched from our facility. Once an order is handed over to the international courier, it cannot be cancelled.

## 2. No Returns Policy
As per strict international pharmaceutical safety standards, we **cannot accept returns** of any medication once it has left our temperature-controlled facility, even if the package remains unopened, to protect public health.

## 3. Exceptions for Refund or Reshipment 
We will issue a full refund or provide a free priority replacement only under the following conditions:
- **Wrong Product Received:** The item received does not match your confirmed order.
- **Damaged in Transit:** The product arrives significantly damaged or compromised.
- **Lost Package:** The courier officially confirms the package is lost and cannot be delivered.

## 4. Claim Process
To initiate a claim for the exceptions above, you must contact `support@mediseller.com` within **7 days** of delivery. You must include photographic evidence of the damaged or incorrect item alongside your order number.
"""

API_URL = "http://127.0.0.1:8001"

def main():
    session = requests.Session()
    
    # 1. Login to get the secure session cookie
    print("Logging in...")
    login_res = session.post(f"{API_URL}/api/admin/login", json={
        "email": "admin@mediseller.com",
        "password": "MediSeller#Admin@2026"
    })
    
    if not login_res.ok:
        print(f"Login failed! Status: {login_res.status_code}")
        print(login_res.text)
        return
        
    print("Logged in successfully.")
    print("Cookies after login:", session.cookies.get_dict())

    # 2. Fetch current config
    print("Fetching current configuration...")
    res = session.get(f"{API_URL}/api/site-config")
    if not res.ok:
        print("Failed to fetch config!")
        return
        
    config = res.json()
    
    # Update legal pages
    config["legal_pages"] = {
        "privacy_policy": {
            "title": "Privacy Policy",
            "last_updated": "March 24, 2026",
            "content": PRIVACY
        },
        "terms_of_service": {
            "title": "Terms of Service",
            "last_updated": "March 24, 2026",
            "content": TERMS
        },
        "refund_policy": {
            "title": "Refund Policy",
            "last_updated": "March 24, 2026",
            "content": REFUND
        }
    }
    
    # 3. Post updated configuration back
    print("Posting updated configuration...")
    # Be explicit about cookies if session doesn't carry them
    res2 = session.post(f"{API_URL}/api/admin/site-config", json=config)
    
    if res2.ok:
        print("Legal pages successfully seeded with professional content!")
    else:
        print(f"Failed to update config: {res2.status_code}")
        print(res2.text)

if __name__ == "__main__":
    main()
