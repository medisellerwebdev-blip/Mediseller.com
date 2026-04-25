import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def check():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'mediseller_v2')
    ca = certifi.where()
    
    client = AsyncIOMotorClient(
        mongo_url,
        tlsCAFile=ca,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True
    )
    db = client[db_name]
    
    print(f"Checking DB: {db_name}")
    products = await db.products.find({}, {"name": 1, "slug": 1, "product_id": 1}).to_list(length=10)
    
    for p in products:
        print(f"ID: {p.get('product_id')} | Slug: {p.get('slug')} | Name: {p.get('name')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
