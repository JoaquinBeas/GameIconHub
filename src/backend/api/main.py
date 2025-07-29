# main.py

import socket
import json
import os
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, Query, Path, HTTPException, Body
from fastapi.responses import StreamingResponse
from backend.core.response_cleaner import ResponseCleaner
from backend.models.dto.shortcut_request import ShortcutRequest
from backend.services.steam_service import SteamService
from fastapi.middleware.cors import CORSMiddleware
from backend.infraestructure.mongo_client import MongoGameIconsClient

app = FastAPI(
    title="Steam Service API",
    version="1.0.0",
    description="REST wrapper sobre SteamService"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ["http://localhost:PORT"] # TODO: Solo puerto del frontal
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def find_free_port():
    with socket.socket() as s:
        s.bind(('', 0))  # sistema asigna puerto disponible
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

steam_client = SteamService()
response_cleaner = ResponseCleaner()
mongo_client = MongoGameIconsClient()

# ---------- 0. Ping ----------
@app.get("/ping")
async def ping():
    return {"status": "ok"}

# ---------- 1. Search suggestions ----------
@app.get("/suggest")
async def suggest_search(term: str = Query(...)):
    response = steam_client.suggest_search(term)
    return response_cleaner.clean_suggestions(response)
    
# ---------- 2. Paginated search ----------
@app.get("/search/paginated")
async def paginated_search(
    term: str = Query(...),
    start: int = Query(0, ge=0),
    count: int = Query(50, gt=0, le=100)
):
    response = steam_client.paginated_search(term, start, count)
    return response_cleaner.clean_paginated_search(response)

# ---------- 3. Infinite search ----------
@app.get("/search/infinite")
async def infinite_search(term: str = Query(...)):
    response = steam_client.infinite_search(term)
    return response_cleaner.clean_infinite_search(response)

# ---------- 4. App webpage ----------
@app.get("/app_icon_url/{app_id}")
async def get_app_icon_url(app_id: str = Path(...)):
    cached = mongo_client.get_by_id(app_id)
    if cached and "icon_url" in cached:
        return cached["icon_url"]

    response = steam_client.get_app_page(app_id)
    icon_url = response_cleaner.extract_icon_url(response)
    if icon_url:
        mongo_client.insert_icon({"id": app_id, "icon_url": icon_url})
        return icon_url
    else:
        raise HTTPException(status_code=404, detail="Icon URL no encontrada")

# ---------- 5. App icon from url ----------
@app.get("/app/image")
async def get_app_image(
    url: str = Query(...)
):
    image_stream = steam_client.get_image_stream(url)
    if image_stream is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    return StreamingResponse(image_stream, media_type="image/jpeg")

# ---------- 6. App icon from by id ----------
@app.get("/app/{app_id}/icon")
async def get_app_icon_image(app_id: str = Path(...)):
    cached = mongo_client.get_by_id(app_id)
    if cached and "icon_url" in cached:
        icon_url = cached["icon_url"]
    else:    
        response = steam_client.get_app_page(app_id)
        icon_url = response_cleaner.extract_icon_url(response)
        if not icon_url:
            raise HTTPException(status_code=404, detail="Icon URL no encontrada")
        mongo_client.insert_icon({"id": app_id, "icon_url": icon_url})

    image_stream = steam_client.get_image_stream(icon_url)
    if image_stream is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    content = image_stream.read()
    img = Image.open(BytesIO(content))
    ico_bytes = BytesIO()
    img.save(ico_bytes, format="ICO")
    ico_bytes.seek(0)

    headers = {
        "Content-Disposition": f"attachment; filename={app_id}.ico"
    }
    return StreamingResponse(ico_bytes, media_type="image/x-icon", headers=headers)


# ---------- 7. Small app icon ----------
@app.get("/app/{app_id}/small_icon_url")
async def get_store_small_icon_url(app_id: str = Path(...)):
    url = steam_client.get_small_icon_url(app_id)
    if not url:
        raise HTTPException(status_code=404, detail="Small icon not found")
    return {"icon_url": url}

# ---------- 8. Generate desktop shortcut ----------
@app.post("/app/{app_id}/generate_shortcut")
async def generate_shortcut(
    app_id: str = Path(...),
    data: ShortcutRequest = Body(...)
):
    app_name = data.app_name
    cached_icon = mongo_client.get_by_id(app_id)
    if cached_icon and "icon_url" in cached_icon:
        icon_url = cached_icon["icon_url"]
    else:
        response = steam_client.get_app_page(app_id)
        icon_url = response_cleaner.extract_icon_url(response)
        if not icon_url:
            return {"success": False, "error": "No se pudo obtener el icono"}
        mongo_client.insert_icon({
            "id": app_id,
            "icon_url": icon_url
        })
    result = steam_client.generate_shortcut(app_name, icon_url)
    if result["success"]:
        return {"detail": "Shortcut created"}
    else:
        raise HTTPException(status_code=500, detail=result["error"])
 
# ---------- 9. Delete desktop shortcut ----------   
@app.delete("/app/delete_shortcut")
async def delete_shortcut(data: ShortcutRequest = Body(...)):
    result = steam_client.delete_shortcut(data.app_name)
    if result["success"]:
        return {"detail": "Shortcut eliminado"}
    else:
        raise HTTPException(status_code=404, detail=result["error"])

# ---------- 10. Rename desktop shortcut ----------    
@app.post("/app/rename_shortcut")
async def rename_shortcut(data: dict = Body(...)):
    # Extract old and new names from raw body
    old_name = data.get("old_name")
    new_name = data.get("new_name")

    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="Both 'old_name' and 'new_name' are required")

    # Call service to rename the actual shortcut
    result = steam_client.rename_shortcut(old_name, new_name)

    if result["success"]:
        return {"detail": "Shortcut renamed"}
    else:
        raise HTTPException(status_code=500, detail=result["error"])