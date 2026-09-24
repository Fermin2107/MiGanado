from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json()
    username = (data or {}).get("username", "").strip()
    password = (data or {}).get("password", "")

    if not username or not password:
        return jsonify({"error": "username y password son requeridos"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "El usuario ya existe"}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    username = (data or {}).get("username", "").strip()
    password = (data or {}).get("password", "")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciales inválidas"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.post("/logout")
def logout():
    # Con JWT stateless el cliente descarta el token; aquí solo confirmamos
    return jsonify({"message": "Sesión cerrada"}), 200
