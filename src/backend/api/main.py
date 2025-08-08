import os
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, Query, Path, HTTPException, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from backend.core.image_helper import ImageHelper
from backend.core.response_cleaner import ResponseCleaner
from backend.models.dto.contact_request import ContactRequest
from backend.models.dto.contribute_request import ContributeRequest
from backend.models.dto.shortcut_request import ShortcutRequest
from backend.services.email_service import EmailService
from backend.services.shortcut_service import ShortcutService
from backend.services.steam_service import SteamService
from backend.infraestructure.mongo_client import MongoGameIconsClient  # versión async con motor

app = FastAPI(
    title="Steam Service API",
    version="1.0.0",
    description="REST wrapper sobre SteamService"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

response_cleaner = ResponseCleaner()
image_helper = ImageHelper()
shortcut_service = ShortcutService()
steam_client = SteamService()
email_service = EmailService()

# ---------- Eventos de ciclo de vida ----------
@app.on_event("startup")
async def startup_event():
    mongo_uri = os.getenv(
        "MONGO_URI",
        "mongodb+srv://read_write_account:HMZY9tsVGjXMWaKo@iconhubcluster.p2akhue.mongodb.net/?retryWrites=true&w=majority&appName=IconHubCluster"
    )
    mongo_client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=3000)
    app.state.mongo = MongoGameIconsClient(mongo_client)

@app.on_event("shutdown")
async def shutdown_event():
    app.state.mongo.client.close()

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
    cached = await app.state.mongo.get_by_id(app_id)
    if cached and "icon_url" in cached:
        return cached["icon_url"]

    response = steam_client.get_app_page(app_id)
    icon_url = response_cleaner.extract_icon_url(response)
    if icon_url:
        await app.state.mongo.insert_icon({"id": app_id, "icon_url": icon_url})
        return icon_url
    else:
        raise HTTPException(status_code=404, detail="Icon URL no encontrada")

# ---------- 5. App icon from url ----------
@app.get("/app/image")
async def get_app_image(url: str = Query(...)):
    image_stream = image_helper.get_image_stream(url)
    if image_stream is None:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    return StreamingResponse(image_stream, media_type="image/jpeg")

# ---------- 6. App icon from by id ----------
@app.get("/app/{app_id}/icon")
async def get_app_icon_image(app_id: str = Path(...)):
    cached = await app.state.mongo.get_by_id(app_id)
    if cached and "icon_url" in cached:
        icon_url = cached["icon_url"]
    else:
        response = steam_client.get_app_page(app_id)
        icon_url = response_cleaner.extract_icon_url(response)
        if not icon_url:
            raise HTTPException(status_code=404, detail="Icon URL no encontrada")
        await app.state.mongo.insert_icon({"id": app_id, "icon_url": icon_url})

    image_stream = image_helper.get_image_stream(icon_url)
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
async def generate_shortcut(app_id: str = Path(...), data: ShortcutRequest = Body(...)):
    app_name = data.app_name
    cached_icon = await app.state.mongo.get_by_id(app_id)
    if cached_icon and "icon_url" in cached_icon:
        icon_url = cached_icon["icon_url"]
    else:
        response = steam_client.get_app_page(app_id)
        icon_url = response_cleaner.extract_icon_url(response)
        if not icon_url:
            return {"success": False, "error": "No se pudo obtener el icono"}
        await app.state.mongo.insert_icon({"id": app_id, "icon_url": icon_url})
    result = shortcut_service.generate_shortcut(app_name, icon_url)
    if result["success"]:
        return {"detail": "Shortcut created"}
    else:
        raise HTTPException(status_code=500, detail=result["error"])

# ---------- 9. Delete desktop shortcut ----------
@app.delete("/app/delete_shortcut")
async def delete_shortcut(data: ShortcutRequest = Body(...)):
    result = shortcut_service.delete_shortcut(data.app_name)
    if result["success"]:
        return {"detail": "Shortcut eliminado"}
    else:
        raise HTTPException(status_code=404, detail=result["error"])

# ---------- 10. Rename desktop shortcut ----------
@app.post("/app/rename_shortcut")
async def rename_shortcut(data: dict = Body(...)):
    old_name = data.get("old_name")
    new_name = data.get("new_name")
    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="Both 'old_name' and 'new_name' are required")

    result = shortcut_service.rename_shortcut(old_name, new_name)
    if result["success"]:
        return {"detail": "Shortcut renamed"}
    else:
        raise HTTPException(status_code=500, detail=result["error"])

# ---------- 11. Send email ----------
@app.post("/contact")
async def contact(data: ContactRequest):
    try:
        email_service.send_contact_email(data.email, data.text)
        return {"success": True}
    except Exception as e:
        print("Error al enviar email:", e)
        raise HTTPException(status_code=500, detail="Error al enviar el correo")

@app.post("/contribute")
async def contribute(data: ContributeRequest):
    try:
        message = f"""Contribución recibida:
                        Email: {data.email}
                        Juego: {data.game}
                        URL del icono: {data.iconUrl}
                    """
        email_service.send_contact_email(data.email, message)
        return {"success": True}
    except Exception as e:
        print("Error al enviar contribución:", e)
        raise HTTPException(status_code=500, detail="Error al enviar contribución")
    
@app.get("/app-page/{app_id}")
async def get_app_page(app_id: str = Path(...)):
    page = steam_client.get_app_page(app_id)
    return page