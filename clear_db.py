
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def clear_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.mediseller
    await db.products.delete_many({})
    await db.site_config.delete_many({})
    print("Deleted products and site_config collections")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_db())
