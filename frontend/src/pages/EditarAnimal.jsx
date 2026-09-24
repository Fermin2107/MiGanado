import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import AnimalForm from '../components/AnimalForm';
import Spinner from '../components/ui/Spinner';

const fetchAnimal = (id) => client.get(`/api/animales/${id}`).then((r) => r.data);

export default function EditarAnimal() {
  const { id: animalId } = useParams();
  const qc               = useQueryClient();

  const { data: animal, isLoading, isError } = useQuery({
    queryKey: ['animal', animalId],
    queryFn: () => fetchAnimal(animalId),
  });

  const handleSubmit = async (data) => {
    const res = await client.put(`/api/animales/${animalId}`, data);
    qc.invalidateQueries({ queryKey: ['animal', animalId] });
    qc.invalidateQueries({ queryKey: ['animales', String(res.data.raza_id)] });
    toast.success('Cambios guardados exitosamente');
    // Permanece en la misma pantalla — el usuario puede seguir editando
    // Si quiere ver la ficha, puede usar el link de volver
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Spinner size="xl" color="var(--color-primary)" />
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

  return (
    <>
      <Link
        to={`/animales/${animalId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={15} />
        Volver a la ficha
      </Link>

      <AnimalForm
        title={`Editar Animal — RP: ${animal.rp ?? animalId}`}
        razaId={String(animal.raza_id)}
        defaultValues={{
          ...animal,
          // Normalizar nulos a '' para que los inputs no estén uncontrolled
          ...Object.fromEntries(
            Object.entries(animal).map(([k, v]) => [k, v ?? ''])
          ),
        }}
        onSubmit={handleSubmit}
        backUrl={`/animales/${animalId}`}
      />
    </>
  );
}
