# steam_service.py

import undetected_chromedriver as uc
import re
import subprocess
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from backend.core.window_hider import WindowHider

class SteamService():
    STEAM_BASE_URL = "https://store.steampowered.com"
    STEAMDB_BASE_URL = "https://steamdb.info"
    lenguage = "spanish"
    locale = "ES"
    # NEW: static version hint; keeps current behavior but lets us update on the fly
    CHROME_VERSION_MAIN = 138

    def __init__(self, lenguage="spanish", locale="ES"):
        self.lenguage = lenguage
        self.locale = locale
        self.window_hider = WindowHider()

    
    def suggest_search(self, term):
        # Sends a search suggestion request to Steam for a game term
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
        # Fetches paginated search results from Steam
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
        # Fetches search results in infinite scroll mode
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
        options = uc.ChromeOptions()

        # (unchanged) anti-automation and stealth-ish flags
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                             "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")
        options.add_argument("--disable-javascript")
        options.add_argument("--mute-audio")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--window-position=-5000,-5000")
        options.add_argument("--window-size=1,1")

        # Monkey patch subprocess.Popen to hide the Chrome window (unchanged)
        original_popen = subprocess.Popen
        def hidden_popen(*args, **kwargs):
            startupinfo = self.window_hider.create_hidden_startupinfo()
            kwargs['startupinfo'] = startupinfo
            kwargs['creationflags'] = kwargs.get('creationflags', 0) | subprocess.CREATE_NO_WINDOW
            return original_popen(*args, **kwargs)
        subprocess.Popen = hidden_popen

        driver = None
        tried_retry = False
        last_err = None

        try:
            while True:
                try:
                    # Use the static version hint
                    driver = uc.Chrome(options=options, version_main=self.CHROME_VERSION_MAIN)
                    self.window_hider.hide_chrome_completely(driver)
                    driver.get(url)
                    try:
                        WebDriverWait(driver, 5, poll_frequency=0.1).until(
                            EC.presence_of_element_located((By.TAG_NAME, "body"))
                        )
                    except TimeoutException:
                        print("Timeout waiting for page load.")
                    return driver.page_source
                except Exception as e:
                    last_err = e
                    err_str = str(e)
                    print(err_str)

                    # Only retry once, and only if we can read a browser major version
                    if not tried_retry:
                        tried_retry = True
                        detected_major = self._extract_browser_major(err_str)
                        if detected_major and detected_major != self.CHROME_VERSION_MAIN:
                            # Update the static so future calls use the corrected version
                            SteamService.CHROME_VERSION_MAIN = detected_major
                            # Clean up any partially created driver
                            if driver:
                                try:
                                    driver.quit()
                                except:
                                    pass
                            driver = None
                            # Loop will attempt again with the new major
                            continue

                    print("Error loading page")
                    return None
        finally:
            subprocess.Popen = original_popen
            if driver:
                try:
                    driver.quit()
                except:
                    pass

    def get_small_icon_url(self, app_id: str) -> str:
        url = f"{self.STEAM_BASE_URL}/app/{app_id}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            match = re.search(r'<div class="apphub_AppIcon">\s*<img src="([^"]+)"', response.text)
            return match.group(1) if match else None
        except Exception as e:
            print(f"Error getting small icon")
            return None
