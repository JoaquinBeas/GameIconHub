# backend/infraestructure/mongo_client.py
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
class MongoGameIconsClient:
    def __init__(self, client, db_name="Games", collection_name="icons", max_entries=100000):
        self.client = client
        self.db = client[db_name]
        self.collection = self.db[collection_name]
        self.max_entries = max_entries

    async def ensure_indexes(self):
        """Crear índices si no existen (solo en startup)"""
        await self.collection.create_index("id", unique=True)

    async def get_by_id(self, icon_id: str):
        """Obtener icono por ID y aumentar accessCount"""
        icon = await self.collection.find_one({"id": icon_id})
        if icon:
            await self.collection.update_one({"id": icon_id}, {"$inc": {"accessCount": 1}})
        return icon

    async def insert_icon(self, icon: dict):
        """Insertar icono con rotación si excede el máximo"""
        current_count = await self.collection.count_documents({})

        if current_count >= self.max_entries:
            least_accessed = await self.collection.find_one(sort=[("accessCount", ASCENDING)])
            if least_accessed:
                await self.collection.delete_one({"_id": least_accessed["_id"]})

        if "accessCount" not in icon:
            icon["accessCount"] = 1

        await self.collection.replace_one({"id": icon["id"]}, icon, upsert=True)
