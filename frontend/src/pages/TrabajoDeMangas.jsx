import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Syringe, Heart, Scale, CheckCircle, AlertCircle,
  RotateCcw, X, Scan,
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import '../components/ui/ui.css';

// ── Audio (Web Audio API — sin archivos externos) ─────────────────────────────

function useScanAudio() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const playSuccess = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch { /* audio no disponible */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playError = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.2].forEach((delay) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 220;
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    } catch { /* audio no disponible */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { playSuccess, playError };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0];

const nowTime = () =>
  new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

function buildDetalle(tipo, datos) {
  if (tipo === 'sanidad') {
    const parts = [datos.producto, datos.dosis].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Sanidad';
  }
  if (tipo === 'tacto') return datos.resultado || 'Tacto';
  if (tipo === 'peso') return datos.valor != null ? `${datos.valor} kg` : 'Peso';
  return tipo;
}

const TIPOS = {
  sanidad: { label: 'Sanidad', icon: Syringe },
  tacto:   { label: 'Tacto',   icon: Heart   },
  peso:    { label: 'Peso',    icon: Scale   },
};

const TACTO_OPTS = [
  { val: 'preñada', label: 'Preñada', cls: 'prenada' },
  { val: 'vacía',   label: 'Vacía',   cls: 'vacia'   },
  { val: 'dudosa',  label: 'Dudosa',  cls: 'dudosa'  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrabajoDeMangas() {
  const { playSuccess, playError } = useScanAudio();

  const [tipo, setTipo]                   = useState('sanidad');
  const [sesionProducto, setSesionProducto] = useState('');
  const [sesionDosis, setSesionDosis]     = useState('');

  const [scanValue, setScanValue]         = useState('');
  const [buscando, setBuscando]           = useState(false);
  const [scanFocused, setScanFocused]     = useState(false);

  const [animal, setAnimal]               = useState(null);   // found animal
  const [scanError, setScanError]         = useState(null);   // codigo no encontrado

  const [flashMsg, setFlashMsg]           = useState(null);   // success flash text
  const [tactoResult, setTactoResult]     = useState('');
  const [pesoValor, setPesoValor]         = useState('');
  const [registrando, setRegistrando]     = useState(false);

  const [historial, setHistorial]         = useState([]);

  const scanRef = useRef(null);
  const pesoRef = useRef(null);
  const flashTimer = useRef(null);

  const refocusScan = useCallback(() => {
    setTimeout(() => scanRef.current?.focus(), 80);
  }, []);

  useEffect(() => { refocusScan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showFlash = useCallback((msg) => {
    setFlashMsg(msg);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashMsg(null), 2200);
  }, []);

  // ── Cambio de tipo ──────────────────────────────────────────────────────────

  const handleTipo = (t) => {
    setTipo(t);
    setAnimal(null);
    setScanError(null);
    setTactoResult('');
    setPesoValor('');
    setFlashMsg(null);
    refocusScan();
  };

  // ── Registro de evento ──────────────────────────────────────────────────────

  const registrarEvento = useCallback(async (targetAnimal, datos) => {
    setRegistrando(true);
    try {
      const res = await client.post(`/api/animales/${targetAnimal.id}/eventos`, datos);
      const evento = res.data;
      const detalle = buildDetalle(datos.tipo, datos);

      setHistorial(prev => [{
        evento_id:  evento.id,
        rp:         targetAnimal.rp,
        caravana:   targetAnimal.caravana_rfid,
        nombre:     targetAnimal.nombre,
        tipo:       datos.tipo,
        detalle,
        hora: nowTime(),
      }, ...prev]);

      showFlash(`${targetAnimal.rp || targetAnimal.nombre || 'Animal'} — ${detalle}`);
      setAnimal(null);
      setTactoResult('');
      setPesoValor('');
      playSuccess();
      refocusScan();
    } catch {
      toast.error('Error al registrar el evento');
      refocusScan();
    } finally {
      setRegistrando(false);
    }
  }, [playSuccess, refocusScan, showFlash]);

  // ── Escaneo (Enter en el input) ─────────────────────────────────────────────

  const handleScanKeyDown = useCallback(async (e) => {
    if (e.key !== 'Enter') return;
    const codigo = scanValue.trim();
    if (!codigo) return;

    setScanValue('');
    setBuscando(true);
    setScanError(null);
    setAnimal(null);
    setTactoResult('');
    setPesoValor('');
    setFlashMsg(null);

    try {
      const res = await client.get(`/api/animales/rfid/${encodeURIComponent(codigo)}`);
      const found = res.data;

      if (tipo === 'sanidad') {
        // Auto-registro inmediato
        await registrarEvento(found, {
          tipo:     'sanidad',
          fecha:    todayISO(),
          producto: sesionProducto || undefined,
          dosis:    sesionDosis    || undefined,
        });
      } else {
        setAnimal(found);
        playSuccess();
        if (tipo === 'peso') {
          setTimeout(() => pesoRef.current?.focus(), 120);
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setScanError(codigo);
      } else {
        toast.error('Error al buscar el animal');
      }
      playError();
      refocusScan();
    } finally {
      setBuscando(false);
    }
  }, [scanValue, tipo, sesionProducto, sesionDosis, registrarEvento, playSuccess, playError, refocusScan]);

  // ── Registro tacto / peso ───────────────────────────────────────────────────

  const handleRegistrarTacto = useCallback(() => {
    if (!animal || !tactoResult || registrando) return;
    registrarEvento(animal, { tipo: 'tacto', fecha: todayISO(), resultado: tactoResult });
  }, [animal, tactoResult, registrando, registrarEvento]);

  const handleRegistrarPeso = useCallback(() => {
    if (!animal || registrando) return;
    const val = parseFloat(String(pesoValor).replace(',', '.'));
    if (isNaN(val) || val <= 0) { toast.error('Ingresá un peso válido'); return; }
    registrarEvento(animal, { tipo: 'peso', fecha: todayISO(), valor: val });
  }, [animal, pesoValor, registrando, registrarEvento]);

  // ── Deshacer evento ─────────────────────────────────────────────────────────

  const handleUndo = useCallback(async (eventoId) => {
    try {
      await client.delete(`/api/eventos/${eventoId}`);
      setHistorial(prev => prev.filter(h => h.evento_id !== eventoId));
      toast.success('Evento eliminado');
    } catch {
      toast.error('No se pudo deshacer');
    }
  }, []);

  // ── Finalizar sesión ────────────────────────────────────────────────────────

  const finalizarSesion = () => {
    setHistorial([]);
    setAnimal(null);
    setScanError(null);
    setFlashMsg(null);
    setScanValue('');
    setTactoResult('');
    setPesoValor('');
    refocusScan();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const showForm = animal && (tipo === 'tacto' || tipo === 'peso');

  return (
    <div className="manga-layout">

      {/* Título */}
      <div>
        <h1 className="page-title">Trabajo de Mangas</h1>
        <p className="page-subtitle">Conectá el bastón RFID por Bluetooth y empezá a escanear</p>
      </div>

      {/* Selector de tipo */}
      <div className="manga-tipo-selector">
        {Object.entries(TIPOS).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            className={`manga-tipo-btn${tipo === key ? ' active' : ''}`}
            onClick={() => handleTipo(key)}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>

      {/* Config de sesión (solo Sanidad) */}
      {tipo === 'sanidad' && (
        <div className="manga-session-config" data-session-config="true">
          <div className="input-wrapper">
            <label className="input-label">Producto de sesión</label>
            <input
              className="input-field"
              placeholder="Ej: Ivomec Plus"
              value={sesionProducto}
              onChange={(e) => setSesionProducto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refocusScan()}
            />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Dosis de sesión</label>
            <input
              className="input-field"
              placeholder="Ej: 5 ml"
              value={sesionDosis}
              onChange={(e) => setSesionDosis(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refocusScan()}
            />
          </div>
        </div>
      )}

      {/* Área de escaneo */}
      <div
        className="manga-scan-area"
        onClick={() => scanRef.current?.focus()}
      >
        {/* Indicador de foco */}
        <div className={`manga-scan-status${scanFocused ? ' active' : ' inactive'}`}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>●</span>
          {scanFocused ? 'LISTO PARA ESCANEAR' : 'TOCÁ AQUÍ PARA ACTIVAR'}
        </div>

        {/* Input de escaneo */}
        <input
          ref={scanRef}
          className="manga-scan-input"
          type="text"
          inputMode="none"
          value={scanValue}
          placeholder="Escanee la caravana del animal…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={(e) => setScanValue(e.target.value)}
          onKeyDown={handleScanKeyDown}
          onFocus={() => setScanFocused(true)}
          onBlur={() => setScanFocused(false)}
          aria-label="Campo de escaneo RFID"
        />

        {/* Buscando */}
        {buscando && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 13 }}>
            <Spinner size="sm" />
            Buscando…
          </div>
        )}

        {/* Flash de éxito (Sanidad auto-registro) */}
        {flashMsg && !showForm && (
          <div className="manga-success-flash">
            <CheckCircle size={20} style={{ flexShrink: 0 }} />
            <span>{flashMsg}</span>
          </div>
        )}

        {/* Animal encontrado */}
        {animal && !flashMsg && (
          <div className="manga-animal-card">
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span className="manga-animal-rp">{animal.rp || '—'}</span>
                {animal.nombre && <span className="manga-animal-nombre">{animal.nombre}</span>}
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {animal.sexo && (
                  <Badge variant={animal.sexo === 'Macho' ? 'primary' : 'secondary'}>
                    {animal.sexo}
                  </Badge>
                )}
                {animal.caravana_rfid && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    RFID: {animal.caravana_rfid}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulario rápido — Tacto */}
        {animal && tipo === 'tacto' && (
          <div className="manga-quick-action">
            <div className="manga-tacto-btns">
              {TACTO_OPTS.map(({ val, label, cls }) => (
                <button
                  key={val}
                  className={`manga-tacto-btn${tactoResult === val ? ` selected ${cls}` : ''}`}
                  onClick={() => setTactoResult(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              loading={registrando}
              disabled={!tactoResult || registrando}
              fullWidth
              onClick={handleRegistrarTacto}
            >
              <CheckCircle size={16} />
              Registrar tacto
            </Button>
          </div>
        )}

        {/* Formulario rápido — Peso */}
        {animal && tipo === 'peso' && (
          <div className="manga-quick-action">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <label className="input-label">Peso (kg)</label>
                <input
                  ref={pesoRef}
                  className="input-field"
                  style={{ fontSize: 20, textAlign: 'center', fontWeight: 700 }}
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="385"
                  value={pesoValor}
                  onChange={(e) => setPesoValor(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRegistrarPeso(); } }}
                />
              </div>
              <Button
                loading={registrando}
                disabled={!pesoValor || registrando}
                onClick={handleRegistrarPeso}
              >
                <CheckCircle size={16} />
                Registrar
              </Button>
            </div>
          </div>
        )}

        {/* Error card — caravana no encontrada */}
        {scanError && !animal && (
          <div className="manga-error-card">
            <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-error)', marginBottom: 3 }}>
                Caravana no encontrada:{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{scanError}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Verificá que esté registrada.{' '}
                <Link to="/razas" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Ver mis razas
                </Link>
              </p>
            </div>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2, display: 'flex', flexShrink: 0 }}
              onClick={() => { setScanError(null); refocusScan(); }}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Footer de sesión */}
      <div className="manga-session-footer">
        <div className="manga-counter">
          <strong>{historial.length}</strong>
          animal{historial.length !== 1 ? 'es' : ''} procesado{historial.length !== 1 ? 's' : ''} en esta sesión
        </div>
        {historial.length > 0 && (
          <Button variant="ghost" size="sm" onClick={finalizarSesion}>
            Finalizar sesión
          </Button>
        )}
      </div>

      {/* Historial de sesión */}
      {historial.length > 0 && (
        <div className="manga-history">
          <div className="manga-history-header">
            Historial de sesión — {historial.length} evento{historial.length !== 1 ? 's' : ''}
          </div>
          {historial.map((item) => (
            <div key={item.evento_id} className="manga-history-item">
              <span className="manga-history-hora">{item.hora}</span>
              <span className="manga-history-rp">{item.rp || item.caravana || '—'}</span>
              <span className="manga-history-detail">
                {item.nombre && (
                  <span style={{ marginRight: 6, color: 'var(--color-text)' }}>{item.nombre}</span>
                )}
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {TIPOS[item.tipo]?.label}: {item.detalle}
                </span>
              </span>
              <button
                className="manga-history-undo"
                title="Deshacer este evento"
                onClick={() => handleUndo(item.evento_id)}
              >
                <RotateCcw size={11} />
                Deshacer
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
