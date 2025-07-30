# start_backend.py

import socket
import json
import os
import uvicorn

def find_free_port():
    # Find an available port by binding to port 0 (OS will assign a free one)
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def write_port_config(port):
    """Writes the selected port to a JSON file that the frontend can read"""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'backend-config.json')
    config = {
        "backend_port": port,
        "backend_url": f"http://127.0.0.1:{port}"
    }
    
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"Error saving config")

if __name__ == "__main__":
    port = find_free_port()
    write_port_config(port)
    from backend.api.main import app

    # Start the Uvicorn server on the selected port
    uvicorn.run(app, host="127.0.0.1", port=port)
