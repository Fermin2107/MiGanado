import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Syringe, Heart, Scale, Activity } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ArbolGenealogico from '../components/ArbolGenealogico';

// ── Data fetchers ──────────────────────────────────────────────────────────────

const fetchAnimal = (id) => client.get(`/api/animales/${id}`).then((r) => r.data);
const fetchArbol  = (id) => client.get(`/api/animales/${id}/arbol`).then((r) => r.data);

// ── Field helpers ──────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return null;
  return d.split('-').reverse().join('/');
}

function FichaField({ label, value, mono = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="ficha-field">
      <label>{label}</label>
      <span className={mono ? 'mono' : undefined}>{value}</span>
    </div>
  );
}

// ── EPD definitions ────────────────────────────────────────────────────────────

const EPD_LABELS = {
  epd_nac:   'Nac.',
  epd_dest:  'Dest.',
  epd_leche: 'Leche',
  epd_18m:   '18M',
  epd_pa_v:  'PA/V',
  epd_ce:    'CE',
  epd_aob:   'AOB',
  epd_egs:   'EGS',
  epd_marb:  'Marb.',
};

// ── Morfología: labels de los campos ──────────────────────────────────────────

const MORFO_LABELS = {
  tamano:           'Tamaño',
  pezunas:          'Pezuñas',
  articulacion:     'Articulación',
  ap_delanteros:    'AP Delanteros',
  ap_traseros:      'AP Traseros',
  curv_garrones:    'Curv. Garrones',
  apert_posterior:  'Apert. Posterior',
  ubres_pezones:    'Ubres/Pezones',
  forma_testicular: 'Forma Testicular',
  desplazamiento:   'Desplazamiento',
  clase:            'Clase',
  impresion_general:'Impresión General',
  musculatura:      'Musculatura',
  anchura:          'Anchura',
  costilla:         'Costilla',
  docilidad:        'Docilidad',
};

const VAL_LABELS = {
  val_14m:    '14M',
  val_18m:    '18M',
  val_ternero:'Ternero',
  val_adulto: 'Adulto',
};

// ── Delete modal ───────────────────────────────────────────────────────────────

function DeleteModal({ rp, onConfirm, onCancel, loading }) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Eliminar animal</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ padding: '12px 0', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          ¿Eliminar el animal <strong style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{rp}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>Eliminar</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Historial de eventos ───────────────────────────────────────────────────────

const TIPO_CONFIG = {
  sanidad: { icon: Syringe, label: 'Sanidad', cls: 'sanidad' },
  tacto:   { icon: Heart,   label: 'Tacto',   cls: 'tacto'   },
  peso:    { icon: Scale,   label: 'Peso',    cls: 'peso'    },
  otro:    { icon: Activity, label: 'Otro',   cls: 'otro'    },
};

const TACTO_VARIANT = { 'preñada': 'success', 'vacía': 'default', 'dudosa': 'warning', 'vacia': 'default' };

const FILTROS = ['todos', 'sanidad', 'tacto', 'peso'];

function HistorialEventos({ animalId }) {
  const qc = useQueryClient();
  const [filtro, setFiltro]   = useState('todos');
  const [showAll, setShowAll] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['eventos', animalId],
    queryFn: () => client.get(`/api/animales/${animalId}/eventos`).then(r => r.data),
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/eventos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos', animalId] });
      toast.success('Evento eliminado');
      setConfirmId(null);
    },
    onError: () => {
      toast.error('No se pudo eliminar el evento');
      setConfirmId(null);
    },
  });

  const filtrados  = filtro === 'todos' ? eventos : eventos.filter(e => e.tipo === filtro);
  const visibles   = showAll ? filtrados : filtrados.slice(0, 10);
  const ocultos    = filtrados.length - visibles.length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <>
      {/* Filtros */}
      <div className="event-filter-chips">
        {FILTROS.map(f => (
          <button
            key={f}
            className={`event-chip${filtro === f ? ' active' : ''}`}
            onClick={() => { setFiltro(f); setShowAll(false); }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'todos' && (
              <span style={{ marginLeft: 5, opacity: 0.7 }}>
                ({eventos.filter(e => e.tipo === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
          {filtro === 'todos' ? 'Sin eventos registrados todavía.' : `Sin eventos de tipo "${filtro}".`}
        </p>
      )}

      {filtrados.length > 0 && (
        <div className="timeline">
          {visibles.map(ev => {
            const cfg  = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.otro;
            const Icon = cfg.icon;
            const isConfirming = confirmId === ev.id;
            const isDeleting   = deleteMutation.isPending && confirmId === ev.id;

            return (
              <div key={ev.id} className="timeline-item">
                <div className={`timeline-dot ${cfg.cls}`}>
                  <Icon size={10} strokeWidth={2.5} />
                </div>

                <div className="timeline-card">
                  <div className="timeline-fecha">
                    {fmtDate(ev.fecha)}
                  </div>

                  <div className="timeline-body">
                    <div className="timeline-tipo-label">{cfg.label}</div>

                    {/* Sanidad */}
                    {ev.tipo === 'sanidad' && (
                      <div className="timeline-detail">
                        {[ev.producto, ev.dosis].filter(Boolean).join(' · ') || '—'}
                        {ev.descripcion && (
                          <div className="timeline-descr">{ev.descripcion}</div>
                        )}
                      </div>
                    )}

                    {/* Tacto */}
                    {ev.tipo === 'tacto' && (
                      <div className="timeline-detail" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {ev.resultado ? (
                          <Badge variant={TACTO_VARIANT[ev.resultado.toLowerCase()] || 'default'}>
                            {ev.resultado.charAt(0).toUpperCase() + ev.resultado.slice(1)}
                          </Badge>
                        ) : '—'}
                        {ev.descripcion && (
                          <span className="timeline-descr">{ev.descripcion}</span>
                        )}
                      </div>
                    )}

                    {/* Peso */}
                    {ev.tipo === 'peso' && (
                      <div className="timeline-detail">
                        <span className="timeline-peso-valor">
                          {ev.valor != null ? `${ev.valor} kg` : '—'}
                        </span>
                        {ev.descripcion && (
                          <div className="timeline-descr">{ev.descripcion}</div>
                        )}
                      </div>
                    )}

                    {/* Otro */}
                    {ev.tipo !== 'sanidad' && ev.tipo !== 'tacto' && ev.tipo !== 'peso' && (
                      <div className="timeline-detail">
                        {ev.descripcion || '—'}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="timeline-actions">
                    {isConfirming ? (
                      <div className="timeline-confirm">
                        <span>¿Eliminar?</span>
                        <button
                          className="timeline-confirm-yes"
                          disabled={isDeleting}
                          onClick={() => deleteMutation.mutate(ev.id)}
                        >
                          {isDeleting ? '…' : 'Sí'}
                        </button>
                        <button
                          className="timeline-confirm-no"
                          disabled={isDeleting}
                          onClick={() => setConfirmId(null)}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        className="timeline-delete-btn"
                        title="Eliminar evento"
                        onClick={() => setConfirmId(ev.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ver más */}
      {ocultos > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 10, width: '100%', padding: '8px',
            background: 'none', border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer',
            fontSize: 13, color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-text-muted)'; }}
        >
          Ver {ocultos} evento{ocultos !== 1 ? 's' : ''} más
        </button>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FichaAnimal() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const { data: animal, isLoading, isError } = useQuery({
    queryKey: ['animal', id],
    queryFn:  () => fetchAnimal(id),
    staleTime: 30_000,
  });

  const { data: arbol } = useQuery({
    queryKey: ['arbol', id],
    queryFn:  () => fetchArbol(id),
    staleTime: 30_000,
    enabled:  Boolean(animal),
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.delete(`/api/animales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['animales'] });
      qc.invalidateQueries({ queryKey: ['razas'] });
      toast.success('Animal eliminado');
      navigate(animal?.raza_id ? `/razas/${animal.raza_id}/animales` : '/razas');
    },
    onError: () => toast.error('No se pudo eliminar el animal'),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Spinner size="xl" />
      </div>
    );
  }

  if (isError || !animal) {
    return (
      <div className="alert alert-error" style={{ marginTop: 40 }}>
        Animal no encontrado o sin acceso.
      </div>
    );
  }

  const listaUrl = animal.raza_id ? `/razas/${animal.raza_id}/animales` : '/razas';
  const tieneEPDs = Object.keys(EPD_LABELS).some((k) => animal[k] != null);
  const tieneVals = Object.keys(VAL_LABELS).some((k) => animal[k] != null && animal[k] !== '');
  const tieneHijos = animal.hijos?.length > 0;

  return (
    <div>
      {/* Back link */}
      <Link
        to={listaUrl}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={15} />
        Volver al listado
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1
            className="page-title"
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)' }}>{animal.rp ?? `#${id}`}</span>
            {animal.nombre && (
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 18 }}>
                — {animal.nombre}
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {animal.sexo && (
              <Badge variant={animal.sexo === 'Macho' ? 'primary' : 'secondary'}>
                {animal.sexo}
              </Badge>
            )}
            {animal.valoracion != null && (
              <span style={{
                background: 'var(--color-secondary)', color: '#fff',
                borderRadius: 'var(--radius-md)', padding: '2px 8px',
                fontSize: 12, fontWeight: 700,
              }}>
                Val. {animal.valoracion}
              </span>
            )}
            {animal.fecha_nac && (
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Nac. {fmtDate(animal.fecha_nac)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" onClick={() => setDeleting(true)}>
            <Trash2 size={15} />
            Eliminar
          </Button>
          <Button onClick={() => navigate(`/animales/${id}/editar`)}>
            <Pencil size={15} />
            Editar
          </Button>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="ficha-layout">

        {/* ── LEFT: data sections ── */}
        <div className="ficha-main">

          {/* Identificación */}
          <div className="ficha-section">
            <div className="ficha-section-title">Identificación</div>
            <div className="ficha-grid">
              <FichaField label="RP"           value={animal.rp}           mono />
              <FichaField label="Caravana RFID" value={animal.caravana_rfid} mono />
              <FichaField label="HBA"          value={animal.hba}           mono />
              <FichaField label="Nombre"       value={animal.nombre} />
              <FichaField label="Sexo"         value={animal.sexo} />
              <FichaField label="Fecha nac."   value={fmtDate(animal.fecha_nac)} />
              <FichaField label="Nacimiento"   value={animal.nacimiento} />
              <FichaField label="Color"        value={animal.color} />
              <FichaField label="Familia"      value={animal.familia} />
              <FichaField label="F"            value={animal.f} />
            </div>
          </div>

          {/* Genealogía */}
          {(animal.padre || animal.madre || animal.padre_id || animal.madre_id ||
            animal.abuelo_paterno || animal.abuelo_materno) && (
            <div className="ficha-section">
              <div className="ficha-section-title">Genealogía</div>
              <div className="ficha-grid">
                {(animal.padre_id && animal.padre_rel_rp)
                  ? <FichaField label="Padre (RP)" value={animal.padre_rel_rp} mono />
                  : <FichaField label="Padre" value={animal.padre} />
                }
                {(animal.madre_id && animal.madre_rel_rp)
                  ? <FichaField label="Madre (RP)" value={animal.madre_rel_rp} mono />
                  : <FichaField label="Madre" value={animal.madre} />
                }
                <FichaField label="Abuelo Paterno" value={animal.abuelo_paterno} />
                <FichaField label="Abuelo Materno" value={animal.abuelo_materno} />
              </div>
            </div>
          )}

          {/* Morfología — solo campos con valor */}
          {Object.keys(MORFO_LABELS).some((k) => animal[k] != null && animal[k] !== '') && (
            <div className="ficha-section">
              <div className="ficha-section-title">Morfología</div>
              <div className="ficha-grid">
                {Object.entries(MORFO_LABELS).map(([key, lbl]) =>
                  animal[key] != null && animal[key] !== '' ? (
                    <FichaField key={key} label={lbl} value={animal[key]} />
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* EPDs */}
          {tieneEPDs && (
            <div className="ficha-section">
              <div className="ficha-section-title">EPDs</div>
              <div className="epd-grid">
                {Object.entries(EPD_LABELS).map(([key, lbl]) =>
                  animal[key] != null ? (
                    <div className="epd-card" key={key}>
                      <div className="epd-card-label">{lbl}</div>
                      <div className="epd-card-value">{animal[key]}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Valoraciones */}
          {tieneVals && (
            <div className="ficha-section">
              <div className="ficha-section-title">Valoraciones</div>
              <div className="ficha-grid">
                {Object.entries(VAL_LABELS).map(([key, lbl]) =>
                  animal[key] != null && animal[key] !== '' ? (
                    <FichaField key={key} label={lbl} value={animal[key]} />
                  ) : null
                )}
                {animal.valoracion != null && (
                  <FichaField label="Valoración general" value={animal.valoracion} />
                )}
              </div>
            </div>
          )}

          {/* Hijos */}
          {tieneHijos && (
            <div className="ficha-section">
              <div className="ficha-section-title">Hijos ({animal.hijos.length})</div>
              <div className="table-wrapper" style={{ marginTop: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>RP</th>
                      <th>Nombre</th>
                      <th>Sexo</th>
                      <th>Nac.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animal.hijos.map((h) => (
                      <tr
                        key={h.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/animales/${h.id}`)}
                      >
                        <td className="mono">{h.rp ?? '—'}</td>
                        <td>{h.nombre ?? '—'}</td>
                        <td>
                          {h.sexo ? (
                            <Badge variant={h.sexo === 'Macho' ? 'primary' : 'secondary'}>
                              {h.sexo}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td>{h.fecha_nac ? fmtDate(h.fecha_nac) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historial de eventos */}
          <div className="ficha-section">
            <div className="ficha-section-title">Historial de eventos</div>
            <HistorialEventos animalId={id} />
          </div>

          {/* Observaciones y Premios */}
          {(animal.observaciones || animal.premios) && (
            <div className="ficha-section">
              <div className="ficha-section-title">Notas</div>
              {animal.observaciones && (
                <div style={{ marginBottom: animal.premios ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Observaciones</div>
                  <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{animal.observaciones}</p>
                </div>
              )}
              {animal.premios && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Premios</div>
                  <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{animal.premios}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── RIGHT: árbol genealógico ── */}
        <div className="ficha-tree-col">
          {arbol ? (
            <ArbolGenealogico
              animal={arbol.animal}
              padre={arbol.padre}
              madre={arbol.madre}
            />
          ) : (
            <div className="arbol-wrapper" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
              <Spinner size="md" />
            </div>
          )}
        </div>

      </div>

      {/* Delete confirmation modal */}
      {deleting && (
        <DeleteModal
          rp={animal.rp ?? `#${id}`}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}
