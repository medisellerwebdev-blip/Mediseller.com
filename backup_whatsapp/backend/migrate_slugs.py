
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import re

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

async def migrate_slugs():
    load_dotenv('.env')
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
    db_name = os.environ.get('DB_NAME', 'mediseller_v2')
    
    if not mongo_url:
        print("MONGO_URL not found")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    products = await db.products.find({}).to_list(None)
    print(f"Found {len(products)} products.")
    
    updated_count = 0
    for p in products:
        if not p.get('slug'):
            new_slug = slugify(p['name'])
            # Ensure unique? For now just slugify
            await db.products.update_one({'_id': p['_id']}, {'$set': {'slug': new_slug}})
            updated_count += 1
            print(f"Updated: {p['name']} -> {new_slug}")
            
    print(f"Migration finished. Updated {updated_count} products.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_slugs())
