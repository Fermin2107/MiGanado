import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import AnimalForm from '../components/AnimalForm';

export default function NuevoAnimal() {
  const { id: razaId } = useParams();
  const navigate       = useNavigate();
  const qc             = useQueryClient();

  const handleSubmit = async (data) => {
    const res = await client.post(`/api/razas/${razaId}/animales`, data);
    qc.invalidateQueries({ queryKey: ['animales', razaId] });
    qc.invalidateQueries({ queryKey: ['razas'] });
    toast.success('Animal registrado exitosamente');
    navigate(`/animales/${res.data.id}`);
  };

  return (
    <>
      <Link
        to={`/razas/${razaId}/animales`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={15} />
        Volver al listado
      </Link>

      <AnimalForm
        title="Registrar Animal"
        razaId={razaId}
        defaultValues={{}}
        onSubmit={handleSubmit}
        backUrl={`/razas/${razaId}/animales`}
      />
    </>
  );
}
