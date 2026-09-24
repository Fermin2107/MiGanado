<<<<<<< HEAD
# Genetics v2

Sistema de gestión genética bovina. Backend Flask + Frontend React/Vite + PostgreSQL.

## Requisitos previos

- Python 3.10+
- Node.js 18+
- PostgreSQL (corriendo localmente o en la nube)

---

## Backend

```bash
cd backend

# 1. Crear y activar entorno virtual
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL, SECRET_KEY y JWT_SECRET_KEY

# 4. Crear las tablas en la base de datos
python init_db.py

# 5. Levantar el servidor de desarrollo
python app.py
```

El backend queda disponible en `http://localhost:5000`.

---

## Frontend

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar VITE_API_URL si el backend no está en localhost:5000

# 3. Levantar el servidor de desarrollo
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Variables de entorno

### backend/.env

| Variable        | Descripción                          |
|----------------|--------------------------------------|
| DATABASE_URL    | URL de conexión a PostgreSQL         |
| SECRET_KEY      | Clave secreta Flask                  |
| JWT_SECRET_KEY  | Clave para firmar tokens JWT         |

### frontend/.env

| Variable      | Descripción                     |
|--------------|---------------------------------|
| VITE_API_URL  | URL base del backend (API REST) |

---

## Estructura de la API

Todas las rutas tienen prefijo `/api` y devuelven JSON.

| Método | Ruta                                      | Descripción                        |
|--------|-------------------------------------------|------------------------------------|
| POST   | /api/auth/register                        | Registro de usuario                |
| POST   | /api/auth/login                           | Login, devuelve JWT token          |
| POST   | /api/auth/logout                          | Logout (cliente descarta token)    |
| GET    | /api/razas                                | Listar razas del usuario           |
| POST   | /api/razas                                | Crear raza                         |
| DELETE | /api/razas/:id                            | Eliminar raza (sin animales)       |
| GET    | /api/razas/:id/animales                   | Listar animales paginados          |
| POST   | /api/razas/:id/animales                   | Crear animal                       |
| POST   | /api/razas/:id/animales/exportar          | Exportar animales a Excel          |
| GET    | /api/animales/:id                         | Ficha completa + eventos           |
| PUT    | /api/animales/:id                         | Editar animal                      |
| DELETE | /api/animales/:id                         | Eliminar animal                    |
| GET    | /api/animales/:id/arbol                   | Árbol genealógico (3 generaciones) |
| GET    | /api/animales/rfid/:codigo                | Buscar animal por RFID             |
| GET    | /api/animales/:id/eventos                 | Historial de eventos               |
| POST   | /api/animales/:id/eventos                 | Registrar evento                   |
| DELETE | /api/eventos/:id                          | Eliminar evento                    |
| GET    | /api/health                               | Health check                       |

---

## Deploy en Render

### Servicios necesarios

| Servicio | Tipo | Root Dir |
|---|---|---|
| `genetics-v2-db` | PostgreSQL (free) | — |
| `genetics-v2-backend` | Web Service (Python) | `backend` |
| `genetics-v2-frontend` | Static Site | `frontend` |

### Variables de entorno — Backend (Web Service)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Linkear a `genetics-v2-db` (Render lo inyecta solo con `render.yaml`) |
| `SECRET_KEY` | Generar valor aleatorio (Render lo genera solo con `render.yaml`) |
| `JWT_SECRET_KEY` | Generar valor aleatorio (Render lo genera solo con `render.yaml`) |
| `FRONTEND_URL` | URL del Static Site, ej: `https://genetics-v2-frontend.onrender.com` |

### Variables de entorno — Frontend (Static Site)

| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL del Web Service backend, ej: `https://genetics-v2-backend.onrender.com` |

### Comandos de build/start

**Backend:**
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`

**Frontend:**
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

### Inicializar la base de datos (solo el primer deploy)

Desde **Render Shell** del Web Service backend:

```bash
python init_db.py
```

### Verificar que todo funciona

```bash
# Health check del backend
curl https://genetics-v2-backend.onrender.com/api/health
# Respuesta esperada: {"status": "ok"}
```
=======
# MiGanado
>>>>>>> ef12394e0cc2d92b56c79d8cf7147bc69dec24e4
