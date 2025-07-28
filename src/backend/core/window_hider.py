# window_hider.py

import ctypes
import subprocess
import time
from ctypes import windll, wintypes

class WindowHider:
    """Class to completely hide windows from both the taskbar and the screen."""

    def __init__(self):
        # Load Windows APIs from user32.dll and kernel32.dll
        self.user32 = windll.user32
        self.kernel32 = windll.kernel32

    def hide_chrome_completely(self, driver):
        """Hide the Chrome window completely using multiple techniques."""
        try:
            # Get the process ID of the Chrome driver
            chrome_pid = driver.service.process.pid

            # Wait briefly until Chrome windows are available
            max_wait_time = 2.0
            start_time = time.time()
            chrome_windows_found = False

            # Poll for visible Chrome windows for up to max_wait_time
            while time.time() - start_time < max_wait_time and not chrome_windows_found:
                def check_chrome_windows(hwnd, lParam):
                    # Check if the window belongs to Chrome and is visible
                    pid = wintypes.DWORD()
                    self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    if pid.value == chrome_pid and self.user32.IsWindowVisible(hwnd):
                        nonlocal chrome_windows_found
                        chrome_windows_found = True
                    return not chrome_windows_found  # Continue enum if not found

                # Enumerate all windows and run the check
                EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
                self.user32.EnumWindows(EnumWindowsProc(check_chrome_windows), 0)

                if not chrome_windows_found:
                    time.sleep(0.05)  # Short delay before retrying

            def hide_all_chrome_windows(hwnd, lParam):
                """Apply several techniques to hide Chrome windows."""
                pid = wintypes.DWORD()
                self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

                if pid.value == chrome_pid:
                    # Method 1: Hide the window
                    self.user32.ShowWindow(hwnd, 0)  # SW_HIDE

                    # Method 2: Remove it from taskbar by setting WS_EX_TOOLWINDOW
                    GWL_EXSTYLE = -20
                    WS_EX_TOOLWINDOW = 0x00000080
                    ex_style = self.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
                    self.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_TOOLWINDOW)

                    # Method 3: Move it off-screen
                    self.user32.SetWindowPos(hwnd, 0, -32000, -32000, 1, 1, 0x0040)

                    # Method 4: Minimize it and hide again
                    self.user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE
                    self.user32.ShowWindow(hwnd, 0)  # SW_HIDE after minimize

                return True  # Continue enumerating other windows

            # Enumerate all windows and hide any associated with Chrome
            EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
            self.user32.EnumWindows(EnumWindowsProc(hide_all_chrome_windows), 0)

            return True

        except Exception as e:
            print(f"Error hiding Chrome: {e}")
            return False

    def create_hidden_startupinfo(self):
        """Create a STARTUPINFO structure to launch a process fully hidden."""
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags = subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE (hidden window)
        return startupinfo
