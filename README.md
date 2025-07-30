# Game Icon Hub

**Game Icon Hub** es una aplicación de escritorio construida con Electron y FastAPI que permite buscar juegos en Steam, descargar sus iconos y crear accesos directos personalizados en el escritorio de Windows. También ofrece funcionalidades de contacto y contribución de nuevos juegos por parte de la comunidad.

---

## Características principales

- Búsqueda de juegos por nombre desde Steam
- Vista previa y descarga de iconos de los juegos
- Creación de accesos directos en el escritorio con icono personalizado
- Soporte multilenguaje (español e inglés)
- Persistencia de datos local (ítems enviados, idioma)
- Formulario de contacto para sugerencias
- Formulario de contribución para agregar juegos e iconos manualmente

---

## Tecnologías utilizadas

### Backend
- **FastAPI** (Python)
- **MongoDB Atlas** (caché de iconos)
- **SMTP (Gmail)** para envío de correos

### Frontend
- **Electron** (interfaz de escritorio)
- **HTML, CSS, JS** (modular, con controllers y componentes)
- **i18n** con sistema de traducción dinámica

---

## Estructura del proyecto

