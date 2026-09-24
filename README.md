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
