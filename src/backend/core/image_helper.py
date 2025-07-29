import requests

class ImageHelper:
    @staticmethod
    def get_image_stream(url: str):
        try:
            response = requests.get(url, stream=True)
            if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
                return response.raw
            return None
        except requests.RequestException:
            return None
