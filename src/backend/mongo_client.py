from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import ASCENDING

class MongoGameIconsClient:
    def __init__(self):
        # Connection URI to MongoDB Atlas with read/write credentials
        uri = "mongodb+srv://read_write_account:HMZY9tsVGjXMWaKo@iconhubcluster.p2akhue.mongodb.net/?retryWrites=true&w=majority&appName=IconHubCluster"

        # Create MongoDB client with stable API version
        self.client = MongoClient(uri, server_api=ServerApi('1'))

        # Access the "Games" database and the "icons" collection
        self.db = self.client["Games"]
        self.collection = self.db["icons"]

        # Set a maximum cap for documents in the collection
        self.max_entries = 100000

        # Ensure a unique index on the "id" field to avoid duplicates
        self.collection.create_index("id", unique=True)

    def get_by_id(self, icon_id: str):
        # Fetch an icon document by its unique ID
        icon = self.collection.find_one({"id": icon_id})
        if icon:
            # Increment the access count if the icon exists
            self.collection.update_one({"id": icon_id}, {"$inc": {"accessCount": 1}})
        return icon

    def insert_icon(self, icon: dict):
        # Get the current number of documents in the collection
        current_count = self.collection.count_documents({})

        if current_count >= self.max_entries:
            # If the collection is full, delete the least accessed icon
            least_accessed = self.collection.find_one(sort=[("accessCount", ASCENDING)])
            if least_accessed:
                self.collection.delete_one({"_id": least_accessed["_id"]})

        # Initialize access count if not present
        if "accessCount" not in icon:
            icon["accessCount"] = 1

        # Insert the new icon or replace it if an icon with the same ID already exists
        self.collection.replace_one({"id": icon["id"]}, icon, upsert=True)
