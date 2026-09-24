from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Animal, Raza, EventoAnimal

eventos_bp = Blueprint("eventos", __name__)

TIPOS_VALIDOS = {"sanidad", "tacto", "peso", "otro"}


def _get_user_animal(animal_id):
    user_id = int(get_jwt_identity())
    return Animal.query.join(Raza).filter(
        Animal.id == animal_id, Raza.user_id == user_id
    ).first_or_404()


@eventos_bp.get("/api/animales/<int:animal_id>/eventos")
@jwt_required()
def listar_eventos(animal_id):
    _get_user_animal(animal_id)
    eventos = EventoAnimal.query.filter_by(animal_id=animal_id).order_by(EventoAnimal.fecha.desc()).all()
    return jsonify([e.to_dict() for e in eventos]), 200


@eventos_bp.post("/api/animales/<int:animal_id>/eventos")
@jwt_required()
def crear_evento(animal_id):
    _get_user_animal(animal_id)
    data = request.get_json() or {}

    tipo = data.get("tipo", "").strip()
    if tipo not in TIPOS_VALIDOS:
        return jsonify({"error": f"tipo debe ser uno de: {', '.join(TIPOS_VALIDOS)}"}), 400

    fecha_str = data.get("fecha")
    if not fecha_str:
        return jsonify({"error": "fecha es requerida"}), 400

    evento = EventoAnimal(
        animal_id=animal_id,
        fecha=date.fromisoformat(fecha_str),
        tipo=tipo,
        descripcion=data.get("descripcion"),
        valor=data.get("valor"),
        producto=data.get("producto"),
        dosis=data.get("dosis"),
        resultado=data.get("resultado"),
    )
    db.session.add(evento)
    db.session.commit()
    return jsonify(evento.to_dict()), 201


@eventos_bp.delete("/api/eventos/<int:evento_id>")
@jwt_required()
def eliminar_evento(evento_id):
    user_id = int(get_jwt_identity())
    evento = EventoAnimal.query.join(Animal).join(Raza).filter(
        EventoAnimal.id == evento_id, Raza.user_id == user_id
    ).first_or_404()
    db.session.delete(evento)
    db.session.commit()
    return jsonify({"message": "Evento eliminado"}), 200
