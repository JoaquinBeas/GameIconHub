from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import ASCENDING

class MongoGameIconsClient:
    def __init__(self):
        uri = "mongodb+srv://read_write_account:HMZY9tsVGjXMWaKo@iconhubcluster.p2akhue.mongodb.net/?retryWrites=true&w=majority&appName=IconHubCluster"
        
        self.client = MongoClient(uri, server_api=ServerApi('1'))
        self.db = self.client["Games"]
        self.collection = self.db["icons"]

        self.max_entries = 100000

        self.collection.create_index("id", unique=True)

    def get_by_id(self, icon_id: str):
        icon = self.collection.find_one({"id": icon_id})
        if icon:
            self.collection.update_one({"id": icon_id}, {"$inc": {"accessCount": 1}})
        return icon

    def insert_icon(self, icon: dict):
        current_count = self.collection.count_documents({})

        if current_count >= self.max_entries:
            # Eliminar el menos accedido
            least_accessed = self.collection.find_one(sort=[("accessCount", ASCENDING)])
            if least_accessed:
                self.collection.delete_one({"_id": least_accessed["_id"]})

        # Si no viene con accessCount, lo inicializamos
        if "accessCount" not in icon:
            icon["accessCount"] = 1

        # Insertar (reemplazo si ya existe)
        self.collection.replace_one({"id": icon["id"]}, icon, upsert=True)
