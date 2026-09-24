import os
from flask import Flask, jsonify
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

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)

    JWTManager(app)

    login_manager = LoginManager(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    app.register_blueprint(auth_bp)
    app.register_blueprint(razas_bp)
    app.register_blueprint(animales_bp)
    app.register_blueprint(eventos_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
