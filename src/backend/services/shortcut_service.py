from pathlib import Path
import os
import tempfile
import ctypes
from ctypes import wintypes
import time
from PIL import Image
import requests
import Levenshtein
from datetime import datetime
from pyshortcuts import make_shortcut

class ShortcutService:
    
    def generate_shortcut(self, app_name, icon_url):
        # Creates a desktop shortcut with a custom icon downloaded from the given URL
        temp_dir = tempfile.gettempdir()
        icon_png_path = os.path.join(temp_dir, f"{app_name}.png")
        icon_ico_path = os.path.join(temp_dir, f"{app_name}.ico")

        # Download the icon
        r = requests.get(icon_url)
        if r.status_code == 200:
            with open(icon_png_path, 'wb') as f:
                f.write(r.content)
        else:
            return {"success": False, "error": "Could not download icon"}

        # Convert PNG to ICO
        try:
            im = Image.open(icon_png_path)
            im.save(icon_ico_path, format="ICO")
        except Exception as e:
            return {"success": False, "error": f"ICO conversion error: {e}"}

        # Create dummy script and generate shortcut using pyshortcuts
        data_dir = os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming', 'GameIconHub')
        os.makedirs(data_dir, exist_ok=True)
        dummy_path = os.path.join(data_dir, 'dummy_target.bat')
        with open(dummy_path, 'w') as f:
            pass

        make_shortcut(script=dummy_path, name=app_name, icon=icon_ico_path, desktop=True)

        # Rename the shortcut to match the app name using Levenshtein distance
        desktop_path = self.get_desktop_path()
        target_name = app_name
        safe_filename = self.generate_shortcut_filename(target_name)
        target_final_path = desktop_path / safe_filename

        best_match = None
        lowest_distance = float('inf')
        for file in desktop_path.glob("*.lnk"):
            distance = Levenshtein.distance(file.stem.lower(), app_name.lower())
            if distance < lowest_distance:
                best_match = file
                lowest_distance = distance

        MAX_DISTANCE = 5
        time.sleep(1)  # Ensure file write completion

        if best_match and lowest_distance <= MAX_DISTANCE:
            target_final_path = desktop_path / self.generate_shortcut_filename(target_name)
            best_match.rename(target_final_path)
            self.refresh_desktop()
        else:
            print(f"No suitable .lnk file found")

        # Cleanup temporary files
        try:
            for path in [icon_png_path, icon_ico_path, dummy_path]:
                if os.path.exists(path): os.remove(path)
        except:
            pass

        return {"success": True}
    
    def get_desktop_path(self):
        # Retrieves the path to the user's desktop
        CSIDL_DESKTOPDIRECTORY = 0x10
        SHGFP_TYPE_CURRENT = 0
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_DESKTOPDIRECTORY, None, SHGFP_TYPE_CURRENT, buf)
        return Path(buf.value)
    
    def generate_shortcut_filename(self, app_name: str) -> str:
        # Generates a safe filename for a shortcut (removing invalid characters)
        app_name = app_name.replace('_', ' ')
        invalid_chars = r'<>:"/\|?*'
        for ch in invalid_chars:
            app_name = app_name.replace(ch, '')
        return app_name + ".lnk"
       
    def refresh_desktop(self):
        # Forces Windows Explorer to refresh the desktop to show the new shortcut
        SHCNE_ASSOCCHANGED = 0x08000000
        SHCNF_IDLIST = 0x0000
        ctypes.windll.shell32.SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None)

    def delete_shortcut(self, app_name: str) -> dict:
        desktop_path = self.get_desktop_path()

        # Clean app name
        app_name = app_name.replace('_', ' ')
        invalid_chars = r'<>:"/\|?*'
        for ch in invalid_chars:
            app_name = app_name.replace(ch, '')
        target_name = app_name.lower()

        best_matches = []
        lowest_distance = float('inf')

        for file in desktop_path.glob("*.lnk"):
            dist = Levenshtein.distance(file.stem.lower(), target_name)
            if dist < lowest_distance:
                best_matches = [file]
                lowest_distance = dist
            elif dist == lowest_distance:
                best_matches.append(file)

        if not best_matches or lowest_distance > 15:  # adjustable threshold
            return {
                "success": False,
                "error": "No matching shortcut found",
                "distance": lowest_distance if best_matches else None
            }

        # Choose most recent among the best matches
        most_recent = max(best_matches, key=lambda f: f.stat().st_ctime)

        try:
            most_recent.unlink()
            return {
                "success": True,
                "match": most_recent.name,
                "distance": lowest_distance,
                "deleted_time": datetime.fromtimestamp(most_recent.stat().st_ctime).isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def rename_shortcut(self, old_name: str, new_name: str) -> dict:
        desktop_path = self.get_desktop_path()

        def sanitize(name):
            invalid_chars = r'<>:"/\\|?*'
            for ch in invalid_chars:
                name = name.replace(ch, '')
            return name.strip()

        old_file = desktop_path / f"{sanitize(old_name)}.lnk"
        new_file = desktop_path / f"{sanitize(new_name)}.lnk"

        if not old_file.exists():
            return {"success": False, "error": f"Shortcut '{old_file}' not found"}

        try:
            old_file.rename(new_file)
            self.refresh_desktop()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
