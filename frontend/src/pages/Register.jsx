import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, AlertCircle } from 'lucide-react';
import client from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import '../components/ui/ui.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden. Verificá que sean iguales.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/register', {
        username: form.username,
        password: form.password,
      });
      localStorage.setItem('token', data.token);
      navigate('/razas');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al registrarse. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Leaf size={20} />
          </div>
          <span className="auth-logo-name">Genetics</span>
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Ingresá tus datos para empezar</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Usuario"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="Elegí un nombre de usuario"
            required
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            helper="Mínimo 6 caracteres"
            required
          />
          <Input
            label="Confirmar contraseña"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Repetí la contraseña"
            required
          />
          <div style={{ marginTop: 8 }}>
            <Button type="submit" loading={loading} fullWidth size="lg">
              Crear cuenta
            </Button>
          </div>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
