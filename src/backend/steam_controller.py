# steam_controller.py

from io import BytesIO
from PIL import Image
import uvicorn
from fastapi import FastAPI, Query, Path, Response, HTTPException, Body
from fastapi.responses import StreamingResponse
from backend.steam_service import SteamService
from backend.utils.response_cleaner import ResponseCleaner
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(
    title="Steam Service API",
    version="1.0.0",
    description="REST wrapper sobre SteamService"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o especifica ["http://localhost:PORT"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

steam = SteamService()
response_cleaner = ResponseCleaner()

class ShortcutRequest(BaseModel):
    app_name: str
# ---------- 1. Sugerencias de búsqueda ----------
@app.get("/suggest")
async def suggest_search(term: str = Query(...)):
    response = steam.suggest_search(term)
    return response_cleaner.clean_suggestions(response)
    
# ---------- 2. Búsqueda paginada ----------
@app.get("/search/paginated")
async def paginated_search(
    term: str = Query(...),
    start: int = Query(0, ge=0),
    count: int = Query(50, gt=0, le=100)
):
    response = steam.paginated_search(term, start, count)
    return response_cleaner.clean_paginated_search(response)

# ---------- 3. Búsqueda infinita ----------
@app.get("/search/infinite")
async def infinite_search(term: str = Query(...)):
    response = steam.infinite_search(term)
    return response_cleaner.clean_infinite_search(response)

# ---------- 4. Página de una app ----------
@app.get("/app_icon_url/{app_id}")
async def get_app_icon_url(
    app_id: str = Path(...)
):
    response = steam.get_app_page(app_id)
    return response_cleaner.extract_icon_url(response)

# ---------- 5. Imagen de una app ----------
@app.get("/app/image")
async def get_app_image(
    url: str = Query(...)
):
    image_stream = steam.get_image_stream(url)

    if image_stream is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    return StreamingResponse(image_stream, media_type="image/jpeg")

# ---------- 6. Imagen de una app ----------
@app.get("/app/{app_id}/icon")
async def get_app_icon_image(
    app_id: str = Path(...)
):
    response = steam.get_app_page(app_id)
    icon_url = response_cleaner.extract_icon_url(response)

    if not icon_url:
        raise HTTPException(status_code=404, detail="Icon URL no encontrada")

    image_stream = steam.get_image_stream(icon_url)
    if image_stream is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    # Opcional: convertir a .ico si no lo es
    content_type = "image/x-icon"
    filename = f"{app_id}.ico"

    # Si el icon_url ya termina en .ico o el header ya es image/x-icon, lo puedes devolver tal cual.
    # Si no, lo convertimos a .ico usando PIL:
    content = image_stream.read()
    img = Image.open(BytesIO(content))
    ico_bytes = BytesIO()
    img.save(ico_bytes, format="ICO")
    ico_bytes.seek(0)

    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return StreamingResponse(ico_bytes, media_type=content_type, headers=headers)


# ---------- 7. Small game icon ----------
@app.get("/app/{app_id}/small_icon_url")
async def get_store_small_icon_url(app_id: str = Path(...)):
    url = steam.get_small_icon_url(app_id)
    if not url:
        raise HTTPException(status_code=404, detail="Small icon not found")
    return {"icon_url": url}

@app.post("/app/{app_id}/generate_shortcut")
async def generate_shortcut(
    app_id: str = Path(...),
    data: ShortcutRequest = Body(...)
):
    app_name = data.app_name
    response = steam.get_app_page(app_id)
    icon_url = response_cleaner.extract_icon_url(response)
    if not icon_url:
        return {"success": False, "error": "No se pudo obtener el icono"}

    result = steam.generate_shortcut(app_name, icon_url)
    if result["success"]:
        return {"detail": "Shortcut created"}
    else:
        raise HTTPException(status_code=500, detail=result["error"])
    
@app.delete("/app/delete_shortcut")
async def delete_shortcut(data: ShortcutRequest = Body(...)):
    result = steam.delete_shortcut(data.app_name)
    if result["success"]:
        return {"detail": "Shortcut eliminado"}
    else:
        raise HTTPException(status_code=404, detail=result["error"])