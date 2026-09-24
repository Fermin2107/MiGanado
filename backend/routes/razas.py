from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Raza, User

razas_bp = Blueprint("razas", __name__, url_prefix="/api/razas")


@razas_bp.get("")
@jwt_required()
def listar_razas():
    user_id = int(get_jwt_identity())
    razas = Raza.query.filter_by(user_id=user_id).all()
    return jsonify([r.to_dict() for r in razas]), 200


@razas_bp.post("")
@jwt_required()
def crear_raza():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    nombre = (data or {}).get("nombre", "").strip()

    if not nombre:
        return jsonify({"error": "nombre es requerido"}), 400

    if Raza.query.filter_by(nombre=nombre, user_id=user_id).first():
        return jsonify({"error": "Ya existe una raza con ese nombre"}), 409

    raza = Raza(nombre=nombre, user_id=user_id)
    db.session.add(raza)
    db.session.commit()
    return jsonify(raza.to_dict()), 201


@razas_bp.delete("/<int:raza_id>")
@jwt_required()
def eliminar_raza(raza_id):
    user_id = int(get_jwt_identity())
    raza = Raza.query.filter_by(id=raza_id, user_id=user_id).first_or_404()

    if raza.animales:
        return jsonify({"error": "No se puede eliminar una raza con animales"}), 400

    db.session.delete(raza)
    db.session.commit()
    return jsonify({"message": "Raza eliminada"}), 200
