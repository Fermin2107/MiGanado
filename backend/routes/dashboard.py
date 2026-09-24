from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Animal, Raza, EventoAnimal

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/api/dashboard")
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())

    # ── Totales ──────────────────────────────────────
    total_animales = (
        db.session.query(func.count(Animal.id))
        .join(Raza)
        .filter(Raza.user_id == user_id)
        .scalar() or 0
    )
    total_razas = Raza.query.filter_by(user_id=user_id).count()
    machos = (
        db.session.query(func.count(Animal.id))
        .join(Raza)
        .filter(Raza.user_id == user_id, Animal.sexo == "Macho")
        .scalar() or 0
    )
    hembras = (
        db.session.query(func.count(Animal.id))
        .join(Raza)
        .filter(Raza.user_id == user_id, Animal.sexo == "Hembra")
        .scalar() or 0
    )

    # ── Por raza ─────────────────────────────────────
    por_raza_q = (
        db.session.query(Raza.id, Raza.nombre, func.count(Animal.id).label("cantidad"))
        .outerjoin(Animal, Animal.raza_id == Raza.id)
        .filter(Raza.user_id == user_id)
        .group_by(Raza.id, Raza.nombre)
        .order_by(func.count(Animal.id).desc())
        .all()
    )
    por_raza = [
        {"raza_id": r.id, "nombre": r.nombre, "cantidad": r.cantidad}
        for r in por_raza_q
    ]

    # ── Nacimientos recientes (last 5) ───────────────
    nac_q = (
        db.session.query(Animal, Raza.nombre.label("raza_nombre"))
        .join(Raza, Raza.id == Animal.raza_id)
        .filter(Raza.user_id == user_id, Animal.fecha_nac.isnot(None))
        .order_by(Animal.fecha_nac.desc())
        .limit(5)
        .all()
    )
    nacimientos_recientes = [
        {
            "id": a.id,
            "rp": a.rp,
            "nombre": a.nombre,
            "sexo": a.sexo,
            "fecha_nac": a.fecha_nac.isoformat() if a.fecha_nac else None,
            "raza_nombre": rn,
        }
        for a, rn in nac_q
    ]

    # ── Actividad reciente (last 10 eventos) ─────────
    act_q = (
        db.session.query(EventoAnimal, Animal, Raza.nombre.label("raza_nombre"))
        .join(Animal, Animal.id == EventoAnimal.animal_id)
        .join(Raza, Raza.id == Animal.raza_id)
        .filter(Raza.user_id == user_id)
        .order_by(EventoAnimal.fecha.desc(), EventoAnimal.id.desc())
        .limit(10)
        .all()
    )

    def _resumen(ev):
        if ev.tipo == "sanidad":
            parts = [p for p in [ev.producto, ev.dosis] if p]
            return " / ".join(parts) if parts else "Sanidad"
        if ev.tipo == "tacto":
            return ev.resultado.capitalize() if ev.resultado else "Tacto"
        if ev.tipo == "peso":
            return f"{ev.valor} kg" if ev.valor is not None else "Peso"
        return ev.descripcion or "Otro"

    actividad_reciente = [
        {
            "id": ev.id,
            "tipo": ev.tipo,
            "fecha": ev.fecha.isoformat() if ev.fecha else None,
            "animal_id": a.id,
            "animal_rp": a.rp,
            "animal_nombre": a.nombre,
            "raza_nombre": rn,
            "resumen": _resumen(ev),
        }
        for ev, a, rn in act_q
    ]

    # ── EPDs pendientes ───────────────────────────────
    epd_cols = [
        Animal.epd_nac, Animal.epd_dest, Animal.epd_leche, Animal.epd_18m,
        Animal.epd_pa_v, Animal.epd_ce, Animal.epd_aob, Animal.epd_egs, Animal.epd_marb,
    ]
    epds_pendientes = (
        db.session.query(func.count(Animal.id))
        .join(Raza)
        .filter(Raza.user_id == user_id, *[c.is_(None) for c in epd_cols])
        .scalar() or 0
    )

    # ── Tactos con resultado dudoso ───────────────────
    tactos_pendientes_resultado = (
        db.session.query(func.count(EventoAnimal.id))
        .join(Animal, Animal.id == EventoAnimal.animal_id)
        .join(Raza, Raza.id == Animal.raza_id)
        .filter(
            Raza.user_id == user_id,
            EventoAnimal.tipo == "tacto",
            EventoAnimal.resultado == "dudosa",
        )
        .scalar() or 0
    )

    return jsonify({
        "totales": {
            "total_animales": total_animales,
            "total_razas": total_razas,
            "machos": machos,
            "hembras": hembras,
        },
        "por_raza": por_raza,
        "nacimientos_recientes": nacimientos_recientes,
        "actividad_reciente": actividad_reciente,
        "epds_pendientes": epds_pendientes,
        "tactos_pendientes_resultado": tactos_pendientes_resultado,
    }), 200
