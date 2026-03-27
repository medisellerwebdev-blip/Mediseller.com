import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("Testing Site Config...")
    try:
        res = requests.get(f"{BASE_URL}/site-config")
        if res.status_code == 200:
            config = res.json()
            print(f"Site Config Loaded. Categories Title: {config.get('categories_section', {}).get('title')}")
            cards = config.get('categories_section', {}).get('cards', [])
            print(f"Categories Cards Found: {len(cards)}")
            if len(cards) > 0:
                print(f"First Card: {cards[0].get('title')}")
        else:
            print(f"Failed to load config: {res.status_code}")
    except Exception as e:
        print(f"Error testing config: {e}")

    print("\nTesting Products...")
    try:
        res = requests.get(f"{BASE_URL}/products?limit=8")
        if res.status_code == 200:
            products = res.json()
            print(f"Products Found: {len(products)}")
            if len(products) > 0:
                print(f"First Product: {products[0].get('name')}")
        else:
            print(f"Failed to load products: {res.status_code}")
    except Exception as e:
        print(f"Error testing products: {e}")

    print("\nTesting Featured Products...")
    try:
        res = requests.get(f"{BASE_URL}/featured-products?limit=8")
        if res.status_code == 200:
            products = res.json()
            print(f"Featured Products Found: {len(products)}")
        else:
            print(f"Failed to load featured products: {res.status_code}")
    except Exception as e:
        print(f"Error testing featured products: {e}")

if __name__ == "__main__":
    test_api()
