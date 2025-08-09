# Game Icon Hub - Estructura del Proyecto

**Game Icon Hub** es una aplicación de escritorio construida con Electron y FastAPI que permite buscar juegos en Steam, descargar sus iconos y crear accesos directos personalizados en el escritorio de Windows.

---

## Características principales

- Búsqueda de juegos por nombre desde Steam
- Vista previa y descarga de iconos de los juegos
- Creación de accesos directos en el escritorio con icono personalizado
- Soporte multiidioma (español e inglés)
- Persistencia de datos local (ítems enviados, idioma)
- Formulario de contacto para sugerencias
- Formulario de contribución para agregar juegos e iconos manualmente

---

## Tecnologías utilizadas

### Backend
- **FastAPI** (Python) - Framework web moderno y rápido
- **MongoDB Atlas** - Base de datos NoSQL para caché de iconos
- **SMTP (Gmail)** - Servicio de envío de correos electrónicos

### Frontend
- **Electron** - Framework para aplicaciones de escritorio multiplataforma
- **HTML5, CSS3, JavaScript ES6+** - Tecnologías web modernas
- **i18n** - Sistema de internacionalización y traducción dinámica

---

## Estructura del proyecto

```
game-icon-hub/
├── README.md
├── requirements.txt
├── .gitignore
│
└── src/
    ├── start_backend.py
    ├── backend/
    │   ├── api/
    │   │   └── main.py
    │   ├── core/
    │   │   ├── image_helper.py
    │   │   ├── response_cleaner.py
    │   │   └── window_hider.py
    │   ├── infrastructure/
    │   │       └── mongo_client.py
    │   ├── models/
    │   │   ├── dto/
    │   │   │   ├── contact_request.py
    │   │   │   ├── contribute_request.py
    │   │   │   └── shortcut_request.py
    │   │   └── entities/
    │   │       ├── infinite_search_result.py
    │   │       ├── paginated_search_result.py
    │   │       └── suggestion_result.py
    │   │
    │   └── services/
    │       ├── email_service.py
    │       ├── shortcut_service.py
    │       └── steam_service.py
    └── ui/
        ├── package.json
        ├── package-lock.json
        ├── index.html
        ├── renderer.js
        ├── styles.css
        ├── assets/
        │   ├── icons/
        │   │   ├── app_icon.ico
        │   │   ├── app_icon_small.ico
        │   │   └── app_icon_big.ico
        │   └── locales/
        │       ├── en.json
        │       └── es.json
        ├── electron/
        │   ├── main.js
        │   ├── preload.js
        │   └── ipc.js
        ├── components/
        │   ├── ItemCard.js
        │   ├── Modal.js
        │   └── OwnedItemList.js
        ├── controllers/
        │   ├── itemController.js
        │   └── menuController.js
        └── utils/
            ├── backendConfig.js
            └── lang.js
 ```