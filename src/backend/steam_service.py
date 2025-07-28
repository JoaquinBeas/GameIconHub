# steam_service.py
import os
import re
import subprocess
import tempfile
import time
import requests
from PIL import Image
import undetected_chromedriver as uc
from backend.utils.response_cleaner  import ResponseCleaner
from backend.utils.window_hider import WindowHider
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import requests
from pyshortcuts import make_shortcut
import ctypes
from pathlib import Path
from ctypes import wintypes
import Levenshtein



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
        
    def get_small_icon_url(self, app_id: str) -> str:
        url = f"{self.STEAM_BASE_URL}/app/{app_id}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            # Regex match for the img src inside .apphub_AppIcon
            match = re.search(r'<div class="apphub_AppIcon">\s*<img src="([^"]+)"', response.text)
            if match:
                return match.group(1)
            return None
        except Exception as e:
            print(f"[SteamService] Error getting small icon: {e}")
            return None
    
    def generate_shortcut(self,app_name, icon_url):
        temp_dir = tempfile.gettempdir()
        icon_png_path = os.path.join(temp_dir, f"{app_name}.png")
        icon_ico_path = os.path.join(temp_dir, f"{app_name}.ico")
        
        # 1. Download image as PNG (or original format)
        r = requests.get(icon_url)
        if r.status_code == 200:
            with open(icon_png_path, 'wb') as f:
                f.write(r.content)
        else:
            return {"success": False, "error": "Could not download icon"}
        
        # 2. Convert to ICO
        try:
            im = Image.open(icon_png_path)
            im.save(icon_ico_path, format="ICO")
        except Exception as e:
            return {"success": False, "error": f"ICO conversion error: {e}"}

        # 3. Create dummy script for shortcut
        data_dir = os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming', 'GameIconHub')
        os.makedirs(data_dir, exist_ok=True)
        dummy_path = os.path.join(data_dir, 'dummy_target.bat')
        with open(dummy_path, 'w') as f:
            pass

        # 4. Create shortcut with icon
        # desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
        print("ICON_NAME:",app_name)
        make_shortcut(
            script=dummy_path,
            name=app_name,
            icon=icon_ico_path,
            desktop=True,
            startmenu=False,
            terminal=False
        )

        # 5. Wait a bit before deleting the icon (let Windows read it)
        desktop_path = self.get_desktop_path()

        target_name = app_name
        safe_filename = self.generate_shortcut_filename(target_name)
        target_final_path = desktop_path / safe_filename

        # Find closest match among existing .lnk files
        best_match = None
        lowest_distance = float('inf')
        for file in desktop_path.glob("*.lnk"):
            distance = Levenshtein.distance(file.stem.lower(), app_name.lower())
            if distance < lowest_distance:
                best_match = file
                lowest_distance = distance

        MAX_DISTANCE = 5

        time.sleep(1)

        if best_match and lowest_distance <= MAX_DISTANCE:
            print(f"[BACKEND] Found shortcut candidate: {best_match} (distance={lowest_distance})")
            final_name = self.generate_shortcut_filename(target_name)
            target_final_path = desktop_path / final_name
            
            best_match.rename(target_final_path)
            self.refresh_desktop()
            print(f"[BACKEND] Renamed to: {target_final_path}")
        else:
            print(f"[BACKEND] No suitable .lnk file found (min distance={lowest_distance})")
        try:
            if os.path.exists(icon_png_path): os.remove(icon_png_path)
            if os.path.exists(icon_ico_path): os.remove(icon_ico_path)
            if os.path.exists(dummy_path): os.remove(dummy_path)
        except Exception as e:
            pass
        return {"success": True}
    
    def get_desktop_path(self):
        CSIDL_DESKTOPDIRECTORY = 0x10
        SHGFP_TYPE_CURRENT = 0

        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_DESKTOPDIRECTORY, None, SHGFP_TYPE_CURRENT, buf)
        return Path(buf.value)
    
    def generate_shortcut_filename(self, app_name: str) -> str:
        app_name = app_name.replace('_', ' ')
        invalid_chars = r'<>:"/\|?*'
        for ch in invalid_chars:
            app_name = app_name.replace(ch, '')
        return app_name + ".lnk"
       
    def refresh_desktop(self):
        """Force the Windows desktop to refresh"""
        SHCNE_ASSOCCHANGED = 0x08000000
        SHCNF_IDLIST = 0x0000

        ctypes.windll.shell32.SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None)

    def delete_shortcut(self, app_name: str) -> dict:
        from Levenshtein import distance as levenshtein_distance
        desktop_path = self.get_desktop_path()
        app_name = app_name.replace('_', ' ')
        invalid_chars = r'<>:"/\|?*'
        for ch in invalid_chars:
            app_name = app_name.replace(ch, '')
        # Intenta primero nombres exactos (igual que antes)
        possible_names = [
            f"{app_name}.lnk"
        ]

        for name in possible_names:
            shortcut_path = desktop_path / name
            if shortcut_path.exists():
                try:
                    shortcut_path.unlink()
                    print(f"[DELETE] Borrado exacto: {shortcut_path}")
                    return {"success": True, "method": "exact", "match": name}
                except Exception as e:
                    return {"success": False, "error": f"Error al borrar acceso directo: {e}"}

        # Buscar por similitud con Levenshtein (como en generate_shortcut)
        best_match = None
        lowest_distance = float('inf')

        for file in desktop_path.glob("*.lnk"):
            dist = levenshtein_distance(file.stem.lower(), app_name.lower())
            if dist < lowest_distance:
                best_match = file
                lowest_distance = dist

        MAX_DISTANCE = 30  # igual que en generate_shortcut
        if best_match and lowest_distance <= MAX_DISTANCE:
            try:
                best_match.unlink()
                print(f"[DELETE] Borrado por similitud: {best_match} (distancia={lowest_distance})")
                return {
                    "success": True,
                    "method": "levenshtein",
                    "match": best_match.name,
                    "distance": lowest_distance
                }
            except Exception as e:
                return {"success": False, "error": f"Error al borrar por similitud: {e}"}

        return {
            "success": False,
            "error": "No se encontró acceso directo similar",
            "closest_match": best_match.name if best_match else None,
            "distance": lowest_distance
        }
