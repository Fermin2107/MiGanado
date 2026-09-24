import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Pencil } from 'lucide-react';
import client from '../api/client';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const fetchAnimal = (id) => client.get(`/api/animales/${id}`).then((r) => r.data);

export default function FichaPlaceholder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => fetchAnimal(id),
    staleTime: 30_000,
  });

  return (
    <div>
      <Link
        to={animal ? `/razas/${animal.raza_id}/animales` : '/razas'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={15} />
        Volver al listado
      </Link>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="xl" color="var(--color-primary)" />
        </div>
      ) : (
        <>
          {/* Mini-header con datos básicos del animal */}
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{animal?.rp ?? `#${id}`}</span>
                  {animal?.nombre && (
                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 18 }}>
                      — {animal.nombre}
                    </span>
                  )}
                </h1>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {animal?.sexo && (
                    <Badge variant={animal.sexo === 'Macho' ? 'primary' : 'secondary'}>
                      {animal.sexo}
                    </Badge>
                  )}
                  {animal?.fecha_nac && (
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Nac. {animal.fecha_nac.split('-').reverse().join('/')}
                    </span>
                  )}
                  {animal?.valoracion != null && (
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Val. {animal.valoracion}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => navigate(`/animales/${id}/editar`)}>
              <Pencil size={15} />
              Editar
            </Button>
          </div>

          {/* Placeholder de contenido */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1.5px dashed var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '80px 24px',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: 'var(--radius-xl)',
                background: 'var(--color-warning-bg)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-warning)', margin: '0 auto 20px',
              }}
            >
              <Clock size={24} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
              Ficha completa — próximamente
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Acá se mostrará la ficha completa: árbol genealógico, todos los datos morfológicos,
              EPDs, historial de eventos (sanidad, pesos, tactos) y más.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => navigate(`/animales/${id}/editar`)}>
                <Pencil size={15} />
                Editar datos
              </Button>
              <Link to={animal ? `/razas/${animal.raza_id}/animales` : '/razas'}>
                <Button variant="ghost">
                  <ArrowLeft size={15} />
                  Volver al listado
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
