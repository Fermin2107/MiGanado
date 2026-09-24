import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_jwt_extended import JWTManager

from config import Config
from models import db, User
from routes.auth import auth_bp
from routes.razas import razas_bp
from routes.animales import animales_bp
from routes.eventos import eventos_bp
from routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    allowed = os.environ.get("ALLOWED_ORIGINS", "*")
    origins = [o.strip() for o in allowed.split(",")] if allowed != "*" else "*"
    CORS(app, resources={r"/api/*": {"origins": origins}})

    jwt = JWTManager(app)

    login_manager = LoginManager(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    app.register_blueprint(auth_bp)
    app.register_blueprint(razas_bp)
    app.register_blueprint(animales_bp)
    app.register_blueprint(eventos_bp)
    app.register_blueprint(dashboard_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
