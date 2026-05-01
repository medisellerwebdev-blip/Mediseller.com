import requests
import json

API_URL = "http://127.0.0.1:8001"

def main():
    print("Fetching current configuration...")
    res = requests.get(f"{API_URL}/api/site-config")
    if not res.ok:
        print("Failed to fetch config!")
        return
        
    config = res.json()
    legal = config.get("legal_pages", {})
    
    print("\n--- Privacy Policy ---")
    print(legal.get("privacy_policy", {}).get("title"))
    print(legal.get("privacy_policy", {}).get("content")[:100] + "...")
    
    print("\n--- Terms of Service ---")
    print(legal.get("terms_of_service", {}).get("title"))
    print(legal.get("terms_of_service", {}).get("content")[:100] + "...")
    
    print("\n--- Refund Policy ---")
    print(legal.get("refund_policy", {}).get("title"))
    print(legal.get("refund_policy", {}).get("content")[:100] + "...")

if __name__ == "__main__":
    main()
