#!/usr/bin/env python3
# start_backend.py

import socket
import json
import os
import uvicorn

def find_free_port():
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def write_port_config(port):
    """Escribe el puerto a un archivo JSON que el frontend puede leer"""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'backend-config.json')
    config = {
        "backend_port": port,
        "backend_url": f"http://127.0.0.1:{port}"
    }
    
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"✅ Configuración guardada en: {config_path}")
    except Exception as e:
        print(f"⚠️ Error guardando configuración: {e}")

if __name__ == "__main__":
    port = find_free_port()
    write_port_config(port)
    print(f"🚀 Iniciando servidor en puerto {port}")
    
    # Importar la app de FastAPI
    from backend.api.main import app
    
    uvicorn.run(app, host="127.0.0.1", port=port)