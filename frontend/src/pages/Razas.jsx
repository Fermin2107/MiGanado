import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import '../components/ui/ui.css';

function fetchRazas() {
  return client.get('/api/razas').then((r) => r.data);
}

export default function Razas() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data: razas = [], isLoading, isError } = useQuery({
    queryKey: ['razas'],
    queryFn: fetchRazas,
  });

  const createMutation = useMutation({
    mutationFn: (nombre) => client.post('/api/razas', { nombre }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['razas'] });
      toast.success('Raza creada exitosamente');
      setModalOpen(false);
      setNombre('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error ?? 'Error al crear la raza';
      setNombreError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/razas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['razas'] });
      toast.success('Raza eliminada');
      setDeletingId(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.error ?? 'No se pudo eliminar la raza';
      toast.error(msg);
      setDeletingId(null);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setNombreError('');
    const trimmed = nombre.trim();
    if (!trimmed) {
      setNombreError('El nombre de la raza es requerido');
      return;
    }
    createMutation.mutate(trimmed);
  };

  const handleCloseModal = () => {
    if (createMutation.isPending) return;
    setModalOpen(false);
    setNombre('');
    setNombreError('');
  };

  if (isLoading) {
    return (
      <div style={s.center}>
        <Spinner size="xl" color="var(--color-primary)" />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={s.center}>
        <div className="alert alert-error" style={{ maxWidth: 400 }}>
          <AlertCircle size={16} />
          <span>No se pudieron cargar las razas. Revisá tu conexión e intentá de nuevo.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Razas</h1>
          <p className="page-subtitle">
            {razas.length === 0
              ? 'Todavía no tenés razas registradas'
              : `${razas.length} raza${razas.length !== 1 ? 's' : ''} registrada${razas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nueva Raza
        </Button>
      </div>

      {/* Empty state */}
      {razas.length === 0 && (
        <EmptyState
          icon={Tag}
          title="Todavía no tenés razas"
          description="Creá tu primera raza para empezar a registrar animales y llevar el control de tu rodeo."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              Crear primera raza
            </Button>
          }
        />
      )}

      {/* Grid de razas */}
      {razas.length > 0 && (
        <div style={s.grid}>
          {razas.map((raza) => (
            <RazaCard
              key={raza.id}
              raza={raza}
              onNavigate={() => navigate(`/razas/${raza.id}/animales`)}
              onDelete={() => setDeletingId(raza.id)}
            />
          ))}
        </div>
      )}

      {/* Modal crear raza */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Nueva Raza"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-nueva-raza"
              loading={createMutation.isPending}
            >
              Crear raza
            </Button>
          </>
        }
      >
        <form id="form-nueva-raza" onSubmit={handleCreate}>
          <Input
            label="Nombre de la raza"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setNombreError(''); }}
            placeholder="Ej: Angus, Hereford, Braford..."
            error={nombreError}
            autoFocus
          />
        </form>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        open={deletingId !== null}
        onClose={() => !deleteMutation.isPending && setDeletingId(null)}
        title="Eliminar raza"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingId)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.6 }}>
          ¿Estás seguro de que querés eliminar esta raza? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

function RazaCard({ raza, onNavigate, onDelete }) {
  const hasAnimals = raza.total_animales > 0;

  return (
    <div className="raza-card" onClick={onNavigate} style={{ position: 'relative' }}>
      {/* Ícono de raza */}
      <div style={sc.iconRow}>
        <div style={sc.icon}>
          <Tag size={20} />
        </div>
        {hasAnimals && (
          <span
            className="badge badge-primary"
            style={{ fontSize: 12 }}
          >
            {raza.total_animales} animal{raza.total_animales !== 1 ? 'es' : ''}
          </span>
        )}
        {!hasAnimals && (
          <span className="badge badge-default" style={{ fontSize: 12 }}>
            Sin animales
          </span>
        )}
      </div>

      {/* Nombre */}
      <h3 style={sc.name}>{raza.nombre}</h3>

      {/* Footer card */}
      <div style={sc.footer}>
        {!hasAnimals ? (
          <button
            style={sc.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Eliminar raza"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        ) : (
          <span style={sc.animalCount}>
            {raza.total_animales} animales registrados
          </span>
        )}
        <ChevronRight size={16} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
      </div>
    </div>
  );
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
};

const sc = {
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-primary)',
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: 16,
    letterSpacing: '-0.01em',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--color-border)',
    paddingTop: 14,
    marginTop: 4,
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    color: 'var(--color-error)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--transition-fast)',
  },
  animalCount: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
  },
};
