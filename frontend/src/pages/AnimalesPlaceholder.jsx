import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import client from '../api/client';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function AnimalesPlaceholder() {
  const { id } = useParams();

  const { data: razas = [], isLoading } = useQuery({
    queryKey: ['razas'],
    queryFn: () => client.get('/api/razas').then((r) => r.data),
    staleTime: 60_000,
  });

  const raza = razas.find((r) => String(r.id) === String(id));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/razas" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={15} />
          Volver a Razas
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoading ? <Spinner size="sm" color="var(--color-primary)" /> : null}
            {raza ? raza.nombre : `Raza #${id}`}
          </h1>
          <p className="page-subtitle">Listado de animales</p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1.5px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-warning-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-warning)',
            margin: '0 auto 20px',
          }}
        >
          <Clock size={24} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          Próximamente
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 360, margin: '0 auto 28px' }}>
          El listado de animales con carga, edición, árbol genealógico y eventos está en construcción.
        </p>
        <Link to="/razas">
          <Button variant="secondary">
            <ArrowLeft size={15} />
            Volver a Razas
          </Button>
        </Link>
      </div>
    </div>
  );
}
