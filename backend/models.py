from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    razas = db.relationship("Raza", backref="usuario", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username}


class Raza(db.Model):
    __tablename__ = "razas"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    animales = db.relationship("Animal", backref="raza", lazy=True, cascade="all, delete-orphan")
    __table_args__ = (db.UniqueConstraint("nombre", "user_id"),)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "user_id": self.user_id,
            "total_animales": len(self.animales),
        }


class Animal(db.Model):
    __tablename__ = "animales"
    id = db.Column(db.Integer, primary_key=True)
    raza_id = db.Column(db.Integer, db.ForeignKey("razas.id"), nullable=False)

    # Identificación
    rp = db.Column(db.String(50))
    caravana_rfid = db.Column(db.String(50))
    hba = db.Column(db.String(50))
    nombre = db.Column(db.String(100))
    sexo = db.Column(db.String(10))
    fecha_nac = db.Column(db.Date)
    nacimiento = db.Column(db.String(10))
    color = db.Column(db.String(50))

    # Genealogía
    padre = db.Column(db.String(100))
    madre = db.Column(db.String(100))
    padre_id = db.Column(db.Integer, db.ForeignKey("animales.id"), nullable=True)
    madre_id = db.Column(db.Integer, db.ForeignKey("animales.id"), nullable=True)
    abuelo_paterno = db.Column(db.String(100))
    abuelo_materno = db.Column(db.String(100))
    familia = db.Column(db.String(100))
    f = db.Column(db.String(20))

    # Morfología
    tamano = db.Column(db.String(30))
    pezunas = db.Column(db.Float)
    articulacion = db.Column(db.Float)
    ap_delanteros = db.Column(db.String(50))
    ap_traseros = db.Column(db.String(50))
    curv_garrones = db.Column(db.String(50))
    apert_posterior = db.Column(db.String(50))
    ubres_pezones = db.Column(db.String(50))
    forma_testicular = db.Column(db.String(50))
    desplazamiento = db.Column(db.String(50))
    clase = db.Column(db.Float)
    impresion_general = db.Column(db.String(100))
    musculatura = db.Column(db.String(50))
    anchura = db.Column(db.String(50))
    costilla = db.Column(db.String(50))
    docilidad = db.Column(db.String(50))
    valoracion = db.Column(db.Float)
    observaciones = db.Column(db.Text)
    premios = db.Column(db.Text)

    # EPDs
    epd_nac = db.Column(db.Float)
    epd_dest = db.Column(db.Float)
    epd_leche = db.Column(db.Float)
    epd_18m = db.Column(db.Float)
    epd_pa_v = db.Column(db.Float)
    epd_ce = db.Column(db.Float)
    epd_aob = db.Column(db.Float)
    epd_egs = db.Column(db.Float)
    epd_marb = db.Column(db.Float)

    # Valoraciones por etapa
    val_14m = db.Column(db.String(100))
    val_18m = db.Column(db.String(100))
    val_ternero = db.Column(db.String(100))
    val_adulto = db.Column(db.String(100))

    __table_args__ = (db.UniqueConstraint("rp", "raza_id"),)

    padre_rel = db.relationship("Animal", foreign_keys=[padre_id], remote_side="Animal.id", backref="hijos_padre")
    madre_rel = db.relationship("Animal", foreign_keys=[madre_id], remote_side="Animal.id", backref="hijos_madre")

    def to_dict(self, include_eventos=False):
        data = {
            "id": self.id,
            "raza_id": self.raza_id,
            "rp": self.rp,
            "caravana_rfid": self.caravana_rfid,
            "hba": self.hba,
            "nombre": self.nombre,
            "sexo": self.sexo,
            "fecha_nac": self.fecha_nac.isoformat() if self.fecha_nac else None,
            "nacimiento": self.nacimiento,
            "color": self.color,
            "padre": self.padre,
            "madre": self.madre,
            "padre_id": self.padre_id,
            "madre_id": self.madre_id,
            "abuelo_paterno": self.abuelo_paterno,
            "abuelo_materno": self.abuelo_materno,
            "familia": self.familia,
            "f": self.f,
            "tamano": self.tamano,
            "pezunas": self.pezunas,
            "articulacion": self.articulacion,
            "ap_delanteros": self.ap_delanteros,
            "ap_traseros": self.ap_traseros,
            "curv_garrones": self.curv_garrones,
            "apert_posterior": self.apert_posterior,
            "ubres_pezones": self.ubres_pezones,
            "forma_testicular": self.forma_testicular,
            "desplazamiento": self.desplazamiento,
            "clase": self.clase,
            "impresion_general": self.impresion_general,
            "musculatura": self.musculatura,
            "anchura": self.anchura,
            "costilla": self.costilla,
            "docilidad": self.docilidad,
            "valoracion": self.valoracion,
            "observaciones": self.observaciones,
            "premios": self.premios,
            "epd_nac": self.epd_nac,
            "epd_dest": self.epd_dest,
            "epd_leche": self.epd_leche,
            "epd_18m": self.epd_18m,
            "epd_pa_v": self.epd_pa_v,
            "epd_ce": self.epd_ce,
            "epd_aob": self.epd_aob,
            "epd_egs": self.epd_egs,
            "epd_marb": self.epd_marb,
            "val_14m": self.val_14m,
            "val_18m": self.val_18m,
            "val_ternero": self.val_ternero,
            "val_adulto": self.val_adulto,
        }
        if include_eventos:
            data["eventos"] = [e.to_dict() for e in self.eventos]
        return data


class EventoAnimal(db.Model):
    __tablename__ = "eventos_animal"
    id = db.Column(db.Integer, primary_key=True)
    animal_id = db.Column(db.Integer, db.ForeignKey("animales.id"), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # 'sanidad' | 'tacto' | 'peso' | 'otro'
    descripcion = db.Column(db.Text)
    valor = db.Column(db.Float)
    producto = db.Column(db.String(100))
    dosis = db.Column(db.String(50))
    resultado = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    animal = db.relationship("Animal", backref="eventos")

    def to_dict(self):
        return {
            "id": self.id,
            "animal_id": self.animal_id,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "tipo": self.tipo,
            "descripcion": self.descripcion,
            "valor": self.valor,
            "producto": self.producto,
            "dosis": self.dosis,
            "resultado": self.resultado,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
