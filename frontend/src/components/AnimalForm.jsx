import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Mars, Venus } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Button from './ui/Button';
import Input from './ui/Input';
import './ui/ui.css';

// ── Constantes ────────────────────────────────────────────────────────────────

const FLOAT_FIELDS = new Set([
  'pezunas', 'articulacion', 'clase', 'valoracion',
  'epd_nac', 'epd_dest', 'epd_leche', 'epd_18m', 'epd_pa_v',
  'epd_ce', 'epd_aob', 'epd_egs', 'epd_marb',
]);
const INT_FIELDS = new Set(['padre_id', 'madre_id']);

const TABS = [
  { label: 'Identificación', fields: ['rp', 'caravana_rfid', 'hba', 'nombre', 'sexo', 'fecha_nac', 'nacimiento', 'color'] },
  { label: 'Genealogía',     fields: ['padre', 'madre', 'padre_id', 'madre_id', 'abuelo_paterno', 'abuelo_materno', 'familia', 'f'] },
  { label: 'Morfología',     fields: ['tamano', 'pezunas', 'articulacion', 'ap_delanteros', 'ap_traseros', 'curv_garrones', 'apert_posterior', 'ubres_pezones', 'forma_testicular', 'desplazamiento', 'clase', 'impresion_general', 'musculatura', 'anchura', 'costilla', 'docilidad', 'valoracion', 'observaciones', 'premios'] },
  { label: 'EPDs',           fields: ['epd_nac', 'epd_dest', 'epd_leche', 'epd_18m', 'epd_pa_v', 'epd_ce', 'epd_aob', 'epd_egs', 'epd_marb'] },
  { label: 'Valoraciones',   fields: ['val_14m', 'val_18m', 'val_ternero', 'val_adulto'] },
];

const EPD_DEFS = [
  { name: 'epd_nac',   label: 'Peso al Nacer',              sigla: 'DEP Nac.'  },
  { name: 'epd_dest',  label: 'Peso al Destete',            sigla: 'DEP Dest.' },
  { name: 'epd_leche', label: 'Habilidad Materna',          sigla: 'DEP Leche' },
  { name: 'epd_18m',   label: 'Peso 18 Meses',              sigla: 'DEP 18m'   },
  { name: 'epd_pa_v',  label: 'Peso de Vaca al Año',        sigla: 'DEP PA-V'  },
  { name: 'epd_ce',    label: 'Circunferencia Escrotal',    sigla: 'DEP CE'    },
  { name: 'epd_aob',   label: 'Área de Ojo de Bife',        sigla: 'DEP AOB'   },
  { name: 'epd_egs',   label: 'Esp. Grasa Subcutánea',      sigla: 'DEP EGS'   },
  { name: 'epd_marb',  label: 'Marmoleo',                   sigla: 'DEP Marb.' },
];

const MORFO_STRING_DEFS = [
  { name: 'tamano',          label: 'Tamaño'               },
  { name: 'ap_delanteros',   label: 'Aplomos Delanteros'   },
  { name: 'ap_traseros',     label: 'Aplomos Traseros'     },
  { name: 'curv_garrones',   label: 'Curvatura de Garrones'},
  { name: 'apert_posterior', label: 'Apertura Posterior'   },
  { name: 'desplazamiento',  label: 'Desplazamiento'       },
  { name: 'impresion_general',label:'Impresión General'    },
  { name: 'musculatura',     label: 'Musculatura'          },
  { name: 'anchura',         label: 'Anchura'              },
  { name: 'costilla',        label: 'Costilla'             },
  { name: 'docilidad',       label: 'Docilidad'            },
];

const VAL_DEFS = [
  { name: 'val_ternero', label: 'Valoración Ternero' },
  { name: 'val_14m',     label: 'Valoración 14 Meses'},
  { name: 'val_18m',     label: 'Valoración 18 Meses'},
  { name: 'val_adulto',  label: 'Valoración Adulto'  },
];

// ── Combobox de parentesco ────────────────────────────────────────────────────

function ParentCombobox({ label, textField, idField, razaId, setValue, initialValue = '' }) {
  const [localVal, setLocalVal]     = useState(initialValue);
  const [options, setOptions]       = useState([]);
  const [showDrop, setShowDrop]     = useState(false);
  const [fetching, setFetching]     = useState(false);
  const timerRef                    = useRef(null);
  const wrapperRef                  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (val) => {
    clearTimeout(timerRef.current);
    if (val.length < 1) { setOptions([]); setShowDrop(false); return; }
    timerRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const { data } = await client.get(`/api/razas/${razaId}/animales`, {
          params: { search: val, per_page: 8 },
        });
        setOptions(data.animales || []);
        setShowDrop(true);
      } catch { setOptions([]); }
      finally   { setFetching(false); }
    }, 300);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalVal(val);
    setValue(textField, val, { shouldDirty: true });
    setValue(idField,   null,{ shouldDirty: true });
    search(val);
  };

  const handleSelect = (a) => {
    const display = [a.rp, a.nombre].filter(Boolean).join(' – ');
    setLocalVal(display);
    setValue(textField, display,  { shouldDirty: true });
    setValue(idField,   a.id,     { shouldDirty: true });
    setOptions([]);
    setShowDrop(false);
  };

  return (
    <div className="combo-wrapper" ref={wrapperRef}>
      <div className="input-wrapper">
        <label className="input-label">{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            className="input-field"
            value={localVal}
            onChange={handleChange}
            onFocus={() => options.length > 0 && setShowDrop(true)}
            placeholder="Nombre o RP — dejá vacío si es desconocido"
            autoComplete="off"
          />
          {fetching && (
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)', fontSize: 12 }}>
              …
            </span>
          )}
        </div>
      </div>
      {showDrop && options.length > 0 && (
        <div className="combo-dropdown">
          {options.map((a) => (
            <div
              key={a.id}
              className="combo-option"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(a); }}
            >
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{a.rp}</span>
              {a.nombre && <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{a.nombre}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AnimalForm (componente principal) ─────────────────────────────────────────

function hasValue(v) {
  return v !== null && v !== undefined && v !== '';
}

export default function AnimalForm({ defaultValues = {}, onSubmit, razaId, title, backUrl }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving]       = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm({ defaultValues });

  const allValues = watch();
  const watchSexo = allValues.sexo;

  const tabHasContent = TABS.map((tab) =>
    tab.fields.some((f) => hasValue(allValues[f]))
  );

  // ── Conversión de tipos antes de enviar ────────────────────────────────────
  const processData = (raw) => {
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === '' || v === undefined) { out[k] = null; continue; }
      if (FLOAT_FIELDS.has(k)) { out[k] = parseFloat(v) || null; continue; }
      if (INT_FIELDS.has(k))   { out[k] = v ? parseInt(v) : null; continue; }
      out[k] = v;
    }
    return out;
  };

  const onFormSubmit = async (raw) => {
    setSaving(true);
    try {
      await onSubmit(processData(raw));
    } catch (err) {
      const msg    = err.response?.data?.error || 'Error al guardar el animal';
      const status = err.response?.status;
      if (status === 409 || msg.toLowerCase().includes('rp')) {
        setError('rp', { message: msg });
        setActiveTab(0);
        toast.error('El RP ya existe en esta raza');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Hay cambios sin guardar. ¿Salir de todas formas?')) return;
    navigate(backUrl);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {/* Page title */}
      <h1 className="page-title" style={{ marginBottom: 24 }}>{title}</h1>

      {/* Tab nav */}
      <div className="tabs-nav">
        {TABS.map((tab, i) => (
          <button
            key={i}
            type="button"
            className={`tab-btn${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
            {tabHasContent[i] && activeTab !== i && (
              <span className="tab-dot" title="Tiene datos" />
            )}
            {activeTab === i && tabHasContent[i] && (
              <CheckCircle2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Identificación ──────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="tab-panel">
          <div className="form-grid">
            {/* RP */}
            <Input
              label="RP *"
              placeholder="Número de registro"
              error={errors.rp?.message}
              {...register('rp', { required: 'El RP es obligatorio' })}
            />
            <Input label="Caravana / RFID" placeholder="Código de caravana" {...register('caravana_rfid')} />
            <Input label="HBA"             placeholder="Número HBA"         {...register('hba')} />
            <Input label="Nombre"          placeholder="Nombre del animal"  {...register('nombre')} />
            <Input label="Fecha de nacimiento" type="date" {...register('fecha_nac')} />
            <Input label="Tipo de nacimiento"  placeholder="Ej: Simple, Gemelar" {...register('nacimiento')} />
            <Input label="Color"               placeholder="Color del pelaje"    {...register('color')} />
          </div>

          {/* Sexo */}
          <div style={{ marginTop: 24 }}>
            <p className="input-label" style={{ marginBottom: 10 }}>Sexo *</p>
            <div className="sexo-group">
              {[
                { value: 'Macho',  icon: Mars,  className: '' },
                { value: 'Hembra', icon: Venus, className: ' hembra' },
              ].map(({ value, icon: Icon, className }) => (
                <label
                  key={value}
                  className={`sexo-card${watchSexo === value ? ' selected' + className : ''}`}
                >
                  <input
                    type="radio"
                    value={value}
                    style={{ display: 'none' }}
                    {...register('sexo', { required: 'El sexo es obligatorio' })}
                  />
                  <Icon size={18} />
                  {value}
                </label>
              ))}
            </div>
            {errors.sexo && <span className="input-error" style={{ marginTop: 6, display: 'block' }}>{errors.sexo.message}</span>}
          </div>
        </div>
      )}

      {/* ── TAB 2: Genealogía ─────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="tab-panel">
          {/* Hidden fields for IDs (managed by combobox via setValue) */}
          <input type="hidden" {...register('padre_id')} />
          <input type="hidden" {...register('madre_id')} />

          <div className="form-grid">
            <ParentCombobox
              label="Padre"
              textField="padre"
              idField="padre_id"
              razaId={razaId}
              setValue={setValue}
              initialValue={allValues.padre || ''}
            />
            <ParentCombobox
              label="Madre"
              textField="madre"
              idField="madre_id"
              razaId={razaId}
              setValue={setValue}
              initialValue={allValues.madre || ''}
            />
            <Input label="Abuelo Paterno" placeholder="Nombre o RP" {...register('abuelo_paterno')} />
            <Input label="Abuela Materna" placeholder="Nombre o RP" {...register('abuelo_materno')} />
            <Input label="Familia"        placeholder="Línea familiar"    {...register('familia')} />
            <Input label="F (consanguinidad)" placeholder="Coeficiente F" {...register('f')} />
          </div>
        </div>
      )}

      {/* ── TAB 3: Morfología ─────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="tab-panel">
          <div className="form-grid">
            {MORFO_STRING_DEFS.map((f) => (
              <Input key={f.name} label={f.label} {...register(f.name)} />
            ))}

            {/* Campos condicionales por sexo */}
            {(!watchSexo || watchSexo === 'Hembra') && (
              <Input label="Ubres / Pezones" {...register('ubres_pezones')} />
            )}
            {(!watchSexo || watchSexo === 'Macho') && (
              <Input label="Forma Testicular" {...register('forma_testicular')} />
            )}

            {/* Campos numéricos */}
            <Input label="Pezuñas"      type="number" step="0.01" placeholder="0.00" {...register('pezunas')} />
            <Input label="Articulación" type="number" step="0.01" placeholder="0.00" {...register('articulacion')} />
            <Input label="Clase"        type="number" step="0.01" placeholder="0.00" {...register('clase')} />
            <Input label="Valoración"   type="number" step="0.01" placeholder="0.00" {...register('valoracion')} />

            {/* Full-width textareas */}
            <div className="col-full">
              <div className="input-wrapper">
                <label className="input-label">Observaciones</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Observaciones adicionales sobre el animal…"
                  style={{ resize: 'vertical', minHeight: 80 }}
                  {...register('observaciones')}
                />
              </div>
            </div>
            <div className="col-full">
              <div className="input-wrapper">
                <label className="input-label">Premios</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Premios y distinciones obtenidas…"
                  style={{ resize: 'vertical', minHeight: 80 }}
                  {...register('premios')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: EPDs ───────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="tab-panel">
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Diferencias Esperadas en la Progenie (DEPs). Valores numéricos que expresan la superioridad
            genética esperada del animal para cada característica.
          </p>
          <div className="form-grid-3">
            {EPD_DEFS.map((f) => (
              <Input
                key={f.name}
                label={`${f.label} (${f.sigla})`}
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register(f.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: Valoraciones ───────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div className="tab-panel">
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Valoración del animal en distintas etapas de su vida. Campo libre — podés ingresar un
            puntaje, una descripción o cualquier nota relevante.
          </p>
          <div className="form-grid">
            {VAL_DEFS.map((f) => (
              <Input key={f.name} label={f.label} placeholder="Ej: 82 puntos, Muy bueno…" {...register(f.name)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Barra de acciones fija ─────────────────────────────────────────── */}
      <div className="form-action-bar">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Guardar animal
        </Button>
      </div>
    </form>
  );
}
