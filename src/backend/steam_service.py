# steam_service.py
import requests

class SteamService():
    
    STEAM_BASE_URL = "https://store.steampowered.com"
    STEAMDB_BASE_URL = "https://steamdb.info"
    lenguage = "spanish"
    locale = "ES"
    
    def __init__(self, lenguage="spanish",locale="ES"):
        self.lenguage = lenguage
        self.locale = locale
        
    def suggest_search(self, term):
        url = f"{self.STEAM_BASE_URL}/search/suggest"
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
        url = f"{self.STEAM_BASE_URL}/search/results/"
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
        url = f"{self.STEAM_BASE_URL}/search/results"
        params = {
            "term": term,
            "force_infinite": "1",
            "supportedlang": self.lenguage,
            "ndl": "1",
            "snr": "1_7_7_151_7"
        }
        response = requests.get(url, params=params)
        return response.text

    def get_app_page(self, app_id):
        url = f"{self.STEAMDB_BASE_URL}/app/{app_id}/info/"
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "max-age=0",
            "Cookie": "cf_clearance=v9EWgYdlB0u_zbfKM0p_PxXQ0drQuTzgvnY7HQ85jJ0-1752839502-1.2.1.1-GMLSAZY_SvM4YENOQC2UEgxQmKZhkzgHWF33LuhPUDC4O.cKYvyM7A5irauSqlqb1Q_wiu0IJGrNmLZNdqT5JYMy5JzS4gmvVEbQ6pETsL5gqWHWvHZrh..Qb2W7PFYnzm_Gt55_0S8COKGiG3csJvCdXwgKeV71o_FlZ1nGDOvUgfuB1DdmMJaOj7H9LVSuFxT3Ns90tP5zIwjIbDokl2VSjvrcN8Be9acaMHq934Y",  # recorta el valor según tu necesidad real
            "Priority": "u=0, i",
            "Sec-Ch-Ua": '"Not;A Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        return response.text

    def get_app_image(self, app_id, image_hash):
        url = f"https://cdn.fastly.steamstatic.com/steamcommunity/public/images/apps/{app_id}/{image_hash}.jpg"
        response = requests.get(url)
        return response.content 