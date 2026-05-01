from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi
import ssl
from dotenv import load_dotenv

async def check_product():
    load_dotenv()
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'mediseller_v2')
    ca = certifi.where()
    
    print(f"Connecting to: {mongo_url}")
    client = AsyncIOMotorClient(
        mongo_url, 
        tlsCAFile=ca, 
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=5000
    )
    db = client[db_name]
    try:
        # Find product by name (case-insensitive)
        import re
        product = await db.products.find_one({"name": re.compile("orlimax", re.I)})
        if product:
            print("Product Found!")
            print(f"Name: {product.get('name')}")
            print(f"Image URL: {product.get('image_url')}")
            print(f"Additional Images: {product.get('additional_images')}")
            print(f"ID: {product.get('product_id')}")
        else:
            print("Product 'Orlimax' not found in database.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_product())
