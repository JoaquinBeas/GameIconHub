# steam_service.py
import requests

class SteamService():
    
    BASE_URL = "https://store.steampowered.com"
    lenguage = "spanish"
    locale = "ES"
    
    def __init__(self, lenguage="spanish",locale="ES"):
        self.lenguage = lenguage
        self.locale = locale
        
    def suggest_search(self, term):
        url = f"{self.BASE_URL}/search/suggest"
        params = {
            "term": term,
            "f": "games",
            "cc": self.locale,
            "realm": "1",
            "l": self.lenguage,
            "v": "30028830",
            "excluded_content_descriptors[]": ["3", "4"],
            "use_store_query": "1",
            "use_search_spellcheck": "1",
            "search_creators_and_tags": "1"
        }
        response = requests.get(url, params=params)
        return response.text

    def paginated_search(self, term, start=50, count=50):
        url = f"{self.BASE_URL}/search/results/"
        params = {
            "query": "",
            "start": start,
            "count": count,
            "dynamic_data": "",
            "sort_by": "_ASC",
            "term": term,
            "supportedlang": self.lenguage,
            "snr": "1_7_7_151_7",
            "infinite": "1"
        }
        response = requests.get(url, params=params)
        return response.text

    def infinite_search(self, term):
        url = f"{self.BASE_URL}/search/results"
        params = {
            "term": term,
            "force_infinite": "1",
            "supportedlang": self.lenguage,
            "ndl": "1",
            "snr": "1_7_7_151_7"
        }
        response = requests.get(url, params=params)
        return response.text

    def get_app_page(self, app_id, app_name):
        url = f"{self.BASE_URL}/app/{app_id}/{app_name}/"
        response = requests.get(url)
        return response.text

    def get_app_image(self, app_id, image_hash):
        url = f"https://cdn.fastly.steamstatic.com/steamcommunity/public/images/apps/{app_id}/{image_hash}.jpg"
        response = requests.get(url)
        return response.content 