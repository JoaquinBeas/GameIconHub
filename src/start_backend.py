# start_backend.py

import platform
import socket
import json
import os
import uvicorn
import sys
from pathlib import Path

# Añadir el directorio src al sys.path para que Python encuentre backend/
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def find_free_port():
    # Find an available port by binding to port 0 (OS will assign a free one)
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def write_port_config(port):
    if platform.system() == "Windows":
        base_dir = Path(os.getenv("APPDATA")) / "gameiconhub"
    else:
        base_dir = Path.home() / ".config" / "gameiconhub"

    config_dir = base_dir / "config"
    config_dir.mkdir(parents=True, exist_ok=True)

    config_path = config_dir / "backend-config.json"

    if config_path.exists():
        try:
            config_path.unlink()
            print(f"Archivo antiguo {config_path} eliminado")
        except Exception as e:
            print(f"No se pudo borrar {config_path}: {e}")

    config = {
        "backend_port": port,
        "backend_url": f"http://127.0.0.1:{port}"
    }

    try:
        with config_path.open('w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        print(f"Config guardada en: {config_path}")
    except Exception as e:
        print(f"Error al guardar el archivo: {e}")

        
if __name__ == "__main__":
    port = find_free_port()
    write_port_config(port)
    from backend.api.main import app

    # Start the Uvicorn server on the selected port
    uvicorn.run(app, host="127.0.0.1", port=port)
