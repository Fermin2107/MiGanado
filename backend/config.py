import os
from dotenv import load_dotenv

load_dotenv()


def _require_in_prod(name, dev_default):
    val = os.environ.get(name, dev_default)
    if os.environ.get("RENDER") and val == dev_default:
        raise RuntimeError(f"Variable de entorno requerida no configurada en producción: {name}")
    return val


class Config:
    SECRET_KEY = _require_in_prod("SECRET_KEY", "dev-secret-CAMBIAR")
    JWT_SECRET_KEY = _require_in_prod("JWT_SECRET_KEY", "dev-jwt-secret-CAMBIAR")

    _db_url = os.environ.get("DATABASE_URL", "postgresql://localhost/genetics_v2")
    # Render a veces provee "postgres://..." pero SQLAlchemy requiere "postgresql://..."
    SQLALCHEMY_DATABASE_URI = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
