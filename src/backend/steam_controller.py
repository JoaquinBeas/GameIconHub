# steam_controller.py
from fastapi import FastAPI, Query, Path, Response, HTTPException
from fastapi.responses import StreamingResponse
import uvicorn
from backend.steam_service import SteamService
from backend.utils.response_cleaner import ResponseCleaner

app = FastAPI(
    title="Steam Service API",
    version="1.0.0",
    description="REST wrapper sobre SteamService"
)

steam = SteamService()
response_cleaner = ResponseCleaner()

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
    return response
    return response_cleaner.extract_icon_url(response)

# ---------- 5. Imagen de una app ----------
@app.get("/app/{app_id}/image")
async def get_app_image(
    app_id: str = Path(...),
    image_hash: str = Query(...)
):
    image_bytes = steam.get_app_image(app_id, image_hash)
    if not image_bytes:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    print(f"Image bytes length: {len(image_bytes)}")
    icon_bytes = response_cleaner.transform_into_icon(image_bytes)
    return StreamingResponse(icon_bytes, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
