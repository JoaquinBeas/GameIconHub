# steam_service.py
import subprocess
import time
import requests
import undetected_chromedriver as uc
from backend.utils.window_hider import WindowHider
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class SteamService():
    
    STEAM_BASE_URL = "https://store.steampowered.com"
    STEAMDB_BASE_URL = "https://steamdb.info"
    lenguage = "spanish"
    locale = "ES"
    
    def __init__(self, lenguage="spanish",locale="ES"):
        self.lenguage = lenguage
        self.locale = locale
        self.window_hider = WindowHider()
        
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
        
        # Configurar opciones de Chrome
        options = uc.ChromeOptions()
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # Opciones adicionales para máxima invisibilidad
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")  # Más rápido
        options.add_argument("--disable-javascript")  # Solo si no necesitas JS
        options.add_argument("--mute-audio")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        
        # Posición inicial fuera de pantalla
        options.add_argument("--window-position=-5000,-5000")
        options.add_argument("--window-size=1,1")
        
        # Parchar subprocess para usar CREATE_NO_WINDOW
        original_popen = subprocess.Popen
        def hidden_popen(*args, **kwargs):
            startupinfo = self.window_hider.create_hidden_startupinfo()
            kwargs['startupinfo'] = startupinfo
            kwargs['creationflags'] = kwargs.get('creationflags', 0) | subprocess.CREATE_NO_WINDOW
            return original_popen(*args, **kwargs)
        
        subprocess.Popen = hidden_popen
        driver = None
        
        try:
            # Crear driver
            driver = uc.Chrome(options=options)
            
            # Ocultar completamente después de la creación
            hide_success = self.window_hider.hide_chrome_completely(driver)
            if hide_success:
                print("Chrome ocultado exitosamente")
            
            # Navegar a la página
            driver.get(url)
                
            # Esperar a que la página cargue completamente (más rápido que sleep fijo)
            try:
                WebDriverWait(driver, 5,poll_frequency=0.1).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )               
            except TimeoutException:
                print("Timeout esperando a que cargue la página, continuando...")
            
            return driver.page_source
                    
        except Exception as e:
            print(f"Error al cargar la página: {e}")
            return None
            
        finally:
            # Restaurar subprocess original
            subprocess.Popen = original_popen
            
            # Cerrar driver
            if driver:
                try:
                    driver.quit()
                except:
                    pass

    def get_image_stream(self, url: str):
        try:
            response = requests.get(url, stream=True)
            if response.status_code != 200 or "image" not in response.headers.get("Content-Type", ""):
                return None
            return response.raw
        except requests.RequestException:
            return None