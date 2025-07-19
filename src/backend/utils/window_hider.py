# window_hider.py

import ctypes
import subprocess
import time
from ctypes import windll, wintypes


class WindowHider:
    """Clase para ocultar ventanas completamente del taskbar y pantalla"""
    
    def __init__(self):
        self.user32 = windll.user32
        self.kernel32 = windll.kernel32
        
    def hide_chrome_completely(self, driver):
        """Ocultar Chrome completamente usando múltiples técnicas"""
        try:
            chrome_pid = driver.service.process.pid
            
            max_wait_time = 2.0
            start_time = time.time()
            chrome_windows_found = False
            
            while time.time() - start_time < max_wait_time and not chrome_windows_found:
                def check_chrome_windows(hwnd, lParam):
                    pid = wintypes.DWORD()
                    self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    if pid.value == chrome_pid and self.user32.IsWindowVisible(hwnd):
                        nonlocal chrome_windows_found
                        chrome_windows_found = True
                    return not chrome_windows_found
                
                EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
                self.user32.EnumWindows(EnumWindowsProc(check_chrome_windows), 0)
                
                if not chrome_windows_found:
                    time.sleep(0.05)
            
            def hide_all_chrome_windows(hwnd, lParam):
                # Verificar si la ventana pertenece a Chrome
                pid = wintypes.DWORD()
                self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                
                if pid.value == chrome_pid:
                    # Método 1: Ocultar ventana
                    self.user32.ShowWindow(hwnd, 0)  # SW_HIDE
                    
                    # Método 2: Quitar de taskbar usando WS_EX_TOOLWINDOW
                    GWL_EXSTYLE = -20
                    WS_EX_TOOLWINDOW = 0x00000080
                    ex_style = self.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
                    self.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_TOOLWINDOW)
                    
                    # Método 3: Mover fuera de la pantalla
                    self.user32.SetWindowPos(hwnd, 0, -32000, -32000, 1, 1, 0x0040)
                    
                    # Método 4: Minimizar al "tray" (invisible)
                    self.user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE
                    self.user32.ShowWindow(hwnd, 0)  # SW_HIDE después de minimizar
                    
                return True
            
            # Enumerar todas las ventanas y ocultar las de Chrome
            EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
            self.user32.EnumWindows(EnumWindowsProc(hide_all_chrome_windows), 0)
            
            return True
            
        except Exception as e:
            print(f"Error ocultando Chrome: {e}")
            return False
            
    def create_hidden_startupinfo(self):
        """Crear STARTUPINFO para proceso completamente oculto"""
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags = subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE
        return startupinfo