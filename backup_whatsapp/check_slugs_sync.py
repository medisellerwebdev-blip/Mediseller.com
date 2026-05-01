import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('backend/.env')

def check():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'mediseller_v2')
    ca = certifi.where()
    
    print(f"Connecting to: {mongo_url[:20]}...")
    client = MongoClient(
        mongo_url,
        tlsCAFile=ca,
        tlsAllowInvalidCertificates=True
    )
    db = client[db_name]
    
    print(f"Checking products in {db_name}...")
    products = list(db.products.find({}, {"name": 1, "slug": 1, "product_id": 1}).limit(10))
    
    if not products:
        print("No products found!")
    
    for p in products:
        print(f"ID: {p.get('product_id')} | Slug: {p.get('slug')} | Name: {p.get('name')}")
    
    client.close()

if __name__ == "__main__":
    check()
