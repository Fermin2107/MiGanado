import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, ArrowLeft, Search, Pencil, Trash2, Tag, AlertCircle, X, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import '../components/ui/ui.css';

const fetchAnimales = ({ razaId, page, perPage, search, sexo, sortBy, sortDir }) =>
  client
    .get(`/api/razas/${razaId}/animales`, {
      params: {
        page,
        per_page: perPage,
        search: search || undefined,
        sexo: sexo || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      },
    })
    .then((r) => r.data);

const fetchRaza = (razaId) =>
  client.get('/api/razas').then((r) => r.data.find((z) => String(z.id) === String(razaId)));

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function Animales() {
  const { id: razaId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const page    = Number(searchParams.get('page')     || 1);
  const perPage = Number(searchParams.get('per_page') || 25);
  const search  = searchParams.get('search') || '';
  const sexo    = searchParams.get('sexo')   || '';
  const sortBy  = searchParams.get('sort_by')  || 'rp';
  const sortDir = searchParams.get('sort_dir') || 'asc';

  // Local search input (debounced to URL)
  const [localSearch, setLocalSearch] = useState(search);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Import EPDs state
  const [importOpen,   setImportOpen]   = useState(false);
  const [importFile,   setImportFile]   = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError,  setImportError]  = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== search) {
        setSearchParams((p) => {
          const n = new URLSearchParams(p);
          if (localSearch) n.set('search', localSearch); else n.delete('search');
          n.set('page', '1');
          return n;
        });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [localSearch]);                          // eslint-disable-line react-hooks/exhaustive-deps

  const updateParam = (key, value) =>
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      if (value) n.set(key, value); else n.delete(key);
      if (key !== 'page') n.set('page', '1');
      return n;
    });

  const { data: raza } = useQuery({
    queryKey: ['raza-single', razaId],
    queryFn: () => fetchRaza(razaId),
    staleTime: 60_000,
  });

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['animales', razaId, page, perPage, search, sexo, sortBy, sortDir],
    queryFn: () => fetchAnimales({ razaId, page, perPage, search, sexo, sortBy, sortDir }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/animales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['animales', razaId] });
      qc.invalidateQueries({ queryKey: ['razas'] });
      toast.success('Animal eliminado');
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el animal');
      setDeletingId(null);
    },
  });

  const animales     = data?.animales     || [];
  const total        = data?.total        || 0;
  const totalPages   = data?.total_pages  || 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await client.post(
        `/api/razas/${razaId}/animales/exportar`,
        { search: search || undefined, sexo: sexo || undefined, sort_by: sortBy, sort_dir: sortDir },
        { responseType: 'blob' },
      );
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^";\n]+)"?/i);
      const filename = match ? match[1] : 'animales.xlsx';
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel descargado');
    } catch {
      toast.error('No se pudo generar el Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
    setImportOpen(true);
  };

  const handleCloseImport = () => {
    if (importResult?.actualizados > 0) {
      qc.invalidateQueries({ queryKey: ['animales', razaId] });
    }
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setImportFile(f);
    setImportResult(null);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportError(null);
    const fd = new FormData();
    fd.append('archivo', importFile);
    try {
      const res = await client.post(`/api/razas/${razaId}/animales/importar_epds`, fd);
      setImportResult(res.data);
    } catch (err) {
      setImportError(err.response?.data?.error || 'Error al procesar el archivo');
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      key: 'rp', header: 'RP', sortable: true, mono: true, width: 90,
      render: (v) => <span style={{ fontWeight: 600 }}>{v ?? '—'}</span>,
    },
    { key: 'nombre', header: 'Nombre', sortable: true, width: 160 },
    {
      key: 'sexo', header: 'Sexo', width: 90,
      render: (v) => v ? (
        <Badge variant={v === 'Macho' ? 'primary' : 'secondary'}>{v}</Badge>
      ) : '—',
    },
    {
      key: 'fecha_nac', header: 'Nacimiento', sortable: true, width: 110,
      render: (v) => formatDate(v),
    },
    { key: 'padre', header: 'Padre', width: 130 },
    { key: 'madre', header: 'Madre', width: 130 },
    {
      key: 'valoracion', header: 'Val.', sortable: true, mono: true, width: 60,
      render: (v) => v != null ? v.toFixed(2) : '—',
    },
    {
      key: '_actions', header: '', width: 80,
      render: (_, row) => (
        <div
          style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="action-btn"
            title="Editar"
            onClick={() => navigate(`/animales/${row.id}/editar`)}
          >
            <Pencil size={14} />
          </button>
          <button
            className="action-btn action-btn-danger"
            title="Eliminar"
            onClick={() => setDeletingId(row.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="alert alert-error" style={{ maxWidth: 420 }}>
          <AlertCircle size={16} />
          <span>No se pudieron cargar los animales. Revisá tu conexión.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link to="/razas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={15} />
        Todas las razas
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{raza?.nombre ?? `Raza #${razaId}`}</h1>
          <p className="page-subtitle">
            {isLoading ? 'Cargando…' : `${total} animal${total !== 1 ? 'es' : ''} registrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            loading={exporting}
            disabled={total === 0}
            title={total === 0 ? 'No hay animales para exportar' : undefined}
            onClick={handleExport}
          >
            <Download size={15} />
            Exportar Excel
          </Button>
          <Button variant="ghost" onClick={handleOpenImport}>
            <Upload size={15} />
            Importar EPDs
          </Button>
          <Button onClick={() => navigate(`/razas/${razaId}/animales/nuevo`)}>
            <Plus size={16} />
            Registrar Animal
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)', pointerEvents: 'none' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por RP, nombre, padre o madre…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', padding: 2, display: 'flex' }}
              onClick={() => { setLocalSearch(''); updateParam('search', ''); }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="select-field"
          style={{ flex: '0 0 140px' }}
          value={sexo}
          onChange={(e) => updateParam('sexo', e.target.value)}
        >
          <option value="">Todos los sexos</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </select>

        {(search || sexo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalSearch('');
              setSearchParams(new URLSearchParams());
            }}
          >
            <X size={14} />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="xl" color="var(--color-primary)" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && animales.length === 0 && !search && !sexo && (
        <EmptyState
          icon={Tag}
          title="Todavía no hay animales en esta raza"
          description="Registrá el primer animal para empezar a llevar el control de tu rodeo."
          action={
            <Button onClick={() => navigate(`/razas/${razaId}/animales/nuevo`)}>
              <Plus size={16} />
              Registrar el primer animal
            </Button>
          }
        />
      )}

      {/* Empty search */}
      {!isLoading && animales.length === 0 && (search || sexo) && (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No hay animales que coincidan con los filtros aplicados."
          action={
            <Button variant="secondary" onClick={() => { setLocalSearch(''); setSearchParams(new URLSearchParams()); }}>
              Limpiar filtros
            </Button>
          }
        />
      )}

      {/* Table */}
      {!isLoading && animales.length > 0 && (
        <div className={isFetching ? 'fetching-overlay' : ''}>
          <Table
            columns={columns}
            rows={animales}
            onRowClick={(row) => navigate(`/animales/${row.id}`)}
            sortKey={sortBy}
            sortDir={sortDir}
            onSort={(key, dir) => {
              setSearchParams((p) => {
                const n = new URLSearchParams(p);
                n.set('sort_by', key);
                n.set('sort_dir', dir);
                n.set('page', '1');
                return n;
              });
            }}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            onPageChange={(p) => updateParam('page', p)}
            onPerPageChange={(pp) => {
              setSearchParams((prev) => {
                const n = new URLSearchParams(prev);
                n.set('per_page', pp);
                n.set('page', '1');
                return n;
              });
            }}
          />
        </div>
      )}

      {/* Modal eliminar */}
      <Modal
        open={deletingId !== null}
        onClose={() => !deleteMutation.isPending && setDeletingId(null)}
        title="Eliminar animal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingId(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deletingId)}>
              Eliminar
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.6 }}>
          ¿Estás seguro de que querés eliminar este animal? Se eliminarán también todos sus eventos registrados. Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal importar EPDs */}
      <Modal
        open={importOpen}
        onClose={importing ? undefined : handleCloseImport}
        title="Importar EPDs desde Excel"
        footer={
          importResult ? (
            <Button onClick={handleCloseImport}>Cerrar</Button>
          ) : (
            <Button
              loading={importing}
              disabled={!importFile || importing}
              onClick={handleImport}
            >
              Procesar archivo
            </Button>
          )
        }
      >
        {!importResult && (
          <>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 16 }}>
              Subí un Excel con una columna <strong>RP</strong> y las columnas DEP a actualizar.
              Los animales se buscan por RP en esta raza. Solo se actualizan los campos DEP presentes en el archivo.
            </p>

            {/* File input */}
            <label style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
              padding: '20px 16px', cursor: 'pointer', textAlign: 'center',
              background: importFile ? 'var(--color-success-bg)' : 'var(--color-bg)',
              transition: 'background var(--transition-fast)',
            }}>
              <Upload size={24} style={{ margin: '0 auto', color: importFile ? 'var(--color-success)' : 'var(--color-text-disabled)' }} />
              <span style={{ fontSize: 14, color: importFile ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: importFile ? 600 : 400 }}>
                {importFile ? importFile.name : 'Hacé clic para seleccionar un archivo .xlsx'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>

            {importing && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Procesando, puede tardar unos segundos…
              </p>
            )}

            {importError && (
              <div style={{
                marginTop: 12, background: 'var(--color-error-bg)',
                border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-lg)',
                padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, color: 'var(--color-error)' }}>{importError}</span>
              </div>
            )}
          </>
        )}

        {importResult && <ImportResult result={importResult} />}
      </Modal>
    </div>
  );
}

// ── Import result display ──────────────────────────────────────────────────────

function CollapsibleList({ items, renderItem, max = 10 }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, max);
  const hidden  = items.length - max;
  return (
    <div style={{ marginTop: 6 }}>
      {visible.map((item, i) => (
        <div key={i} style={{ fontSize: 13, padding: '2px 0', fontFamily: 'var(--font-mono)' }}>
          {renderItem(item)}
        </div>
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'underline', padding: 0 }}
        >
          y {hidden} más…
        </button>
      )}
    </div>
  );
}

function ImportResult({ result }) {
  const { actualizados, total_filas_procesadas, no_encontrados, valores_invalidos } = result;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Success */}
      <div style={{
        background: 'var(--color-success-bg)',
        border: '1px solid rgba(21,128,61,0.2)',
        borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <CheckCircle size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-success)' }}>
            {actualizados} animal{actualizados !== 1 ? 'es' : ''} actualizado{actualizados !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 6 }}>
            de {total_filas_procesadas} fila{total_filas_procesadas !== 1 ? 's' : ''} procesada{total_filas_procesadas !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Not found */}
      {no_encontrados.length > 0 && (
        <div style={{
          background: 'var(--color-warning-bg)',
          border: '1px solid rgba(180,120,0,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-warning)' }}>
              {no_encontrados.length} RP{no_encontrados.length !== 1 ? 's' : ''} no encontrado{no_encontrados.length !== 1 ? 's' : ''} en esta raza
            </span>
          </div>
          <CollapsibleList items={no_encontrados} renderItem={(rp) => rp} />
        </div>
      )}

      {/* Invalid values */}
      {valores_invalidos.length > 0 && (
        <div style={{
          background: 'var(--color-error-bg)',
          border: '1px solid rgba(185,28,28,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <AlertCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-error)' }}>
              {valores_invalidos.length} valor{valores_invalidos.length !== 1 ? 'es' : ''} no numérico{valores_invalidos.length !== 1 ? 's' : ''} ignorado{valores_invalidos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <CollapsibleList
            items={valores_invalidos}
            renderItem={(v) => `${v.rp} — ${v.columna}: "${v.valor}"`}
          />
        </div>
      )}
    </div>
  );
}
