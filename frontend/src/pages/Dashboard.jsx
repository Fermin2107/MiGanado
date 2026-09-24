import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, Baby } from 'lucide-react';
import client from '../api/client';

function KpiCard({ label, value, subLabel, warning }) {
  return (
    <div className={`dash-kpi-card${warning ? ' dash-kpi-card--warning' : ''}`}>
      <div className="dash-kpi-value">{value}</div>
      <div className="dash-kpi-label">{label}</div>
      {subLabel && <div className="dash-kpi-sublabel">{subLabel}</div>}
    </div>
  );
}

function ProportionKpi({ machos, hembras }) {
  const total = machos + hembras;
  const pctM = total > 0 ? Math.round((machos / total) * 100) : 50;
  const pctH = 100 - pctM;
  return (
    <div className="dash-kpi-card">
      <div className="dash-kpi-pair">
        <div>
          <div className="dash-kpi-value">{machos}</div>
          <div className="dash-kpi-label">Machos</div>
        </div>
        <div>
          <div className="dash-kpi-value">{hembras}</div>
          <div className="dash-kpi-label">Hembras</div>
        </div>
      </div>
      {total > 0 && (
        <>
          <div className="dash-kpi-bar-track">
            <div className="dash-kpi-bar-fill dash-kpi-bar-m" style={{ width: `${pctM}%` }} />
            <div className="dash-kpi-bar-fill dash-kpi-bar-h" style={{ width: `${pctH}%` }} />
          </div>
          <div className="dash-kpi-bar-labels">
            <span>{pctM}% ♂</span>
            <span>{pctH}% ♀</span>
          </div>
        </>
      )}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.cantidad), 1);
  return (
    <div className="dash-barchart">
      {data.map(d => (
        <div key={d.raza_id} className="dash-bar-row">
          <div className="dash-bar-label">{d.nombre}</div>
          <div className="dash-bar-track">
            <div className="dash-bar-fill" style={{ width: `${(d.cantidad / max) * 100}%` }} />
          </div>
          <div className="dash-bar-count">{d.cantidad}</div>
        </div>
      ))}
    </div>
  );
}

const TIPO_COLOR = { sanidad: 'sanidad', tacto: 'tacto', peso: 'peso', otro: 'otro' };
const TIPO_LABEL = { sanidad: 'Sanidad', tacto: 'Tacto', peso: 'Peso', otro: 'Otro' };

function ActivityTimeline({ data }) {
  const fmt = iso => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="timeline">
      {data.map(ev => (
        <div key={ev.id} className="timeline-item">
          <div className={`timeline-dot ${TIPO_COLOR[ev.tipo] || 'otro'}`} />
          <div className="timeline-card">
            <div className="timeline-fecha">{fmt(ev.fecha)}</div>
            <div className="timeline-body">
              <div className="timeline-tipo-label">{TIPO_LABEL[ev.tipo] || ev.tipo}</div>
              <div className="timeline-detail">
                <Link to={`/animales/${ev.animal_id}`} className="dash-animal-link">
                  {ev.animal_rp || ev.animal_nombre || `Animal ${ev.animal_id}`}
                  {ev.animal_nombre && ev.animal_rp ? ` · ${ev.animal_nombre}` : ''}
                </Link>
                {' · '}
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{ev.raza_nombre}</span>
              </div>
              {ev.resumen && <div className="timeline-descr">{ev.resumen}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const fmt = iso => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => client.get('/api/dashboard').then(r => r.data),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  const {
    totales = {},
    por_raza = [],
    nacimientos_recientes = [],
    actividad_reciente = [],
    epds_pendientes = 0,
    tactos_pendientes_resultado = 0,
  } = data || {};

  if (!data || totales.total_razas === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Inicio</h1>
            <p className="page-subtitle">Resumen general de tu establecimiento</p>
          </div>
        </div>
        <div className="empty-state">
          <Home size={40} strokeWidth={1.5} />
          <p className="empty-title">Bienvenido a Genetics</p>
          <p className="empty-desc">Comenzá creando una raza para registrar tus animales.</p>
          <Link to="/razas" className="btn btn-primary">Ir a Razas</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="page-subtitle">Resumen general de tu establecimiento</p>
        </div>
      </div>

      {tactos_pendientes_resultado > 0 && (
        <div className="dash-alert">
          <AlertTriangle size={18} />
          <div>
            <strong>
              {tactos_pendientes_resultado} tacto{tactos_pendientes_resultado !== 1 ? 's' : ''} con resultado dudoso
            </strong>
            <span> — revisalos para actualizar el resultado.</span>
          </div>
        </div>
      )}

      <div className="dash-kpis">
        <KpiCard label="Total animales" value={totales.total_animales} />
        <KpiCard label="Razas" value={totales.total_razas} />
        <ProportionKpi machos={totales.machos} hembras={totales.hembras} />
        <KpiCard
          label="EPDs pendientes"
          value={epds_pendientes}
          subLabel={epds_pendientes > 0 ? 'Sin datos EPD' : undefined}
          warning={epds_pendientes > 0}
        />
      </div>

      <div className="dash-grid">
        {por_raza.length > 0 && (
          <div className="ficha-section">
            <div className="ficha-section-title">Distribución por raza</div>
            <BarChart data={por_raza} />
          </div>
        )}

        {nacimientos_recientes.length > 0 && (
          <div className="ficha-section">
            <div className="ficha-section-title">Nacimientos recientes</div>
            <div className="dash-nac-list">
              {nacimientos_recientes.map(a => (
                <Link key={a.id} to={`/animales/${a.id}`} className="dash-nac-item">
                  <Baby size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <div className="dash-nac-body">
                    <span className="dash-nac-rp">{a.rp || 'Sin RP'}</span>
                    {a.nombre && <span className="dash-nac-nombre"> · {a.nombre}</span>}
                    <span className="dash-nac-raza"> ({a.raza_nombre})</span>
                  </div>
                  <div className="dash-nac-fecha">{fmt(a.fecha_nac)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {actividad_reciente.length > 0 && (
        <div className="ficha-section">
          <div className="ficha-section-title">Actividad reciente</div>
          <ActivityTimeline data={actividad_reciente} />
        </div>
      )}
    </div>
  );
}
