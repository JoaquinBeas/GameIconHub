# steam_controller.py

import uvicorn
from fastapi import FastAPI, Query, Path, Response, HTTPException
from fastapi.responses import StreamingResponse
from backend.steam_service import SteamService
from backend.utils.response_cleaner import ResponseCleaner
from fastapi.middleware.cors import CORSMiddleware


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

    return StreamingResponse(image_stream, media_type="image/jpeg")