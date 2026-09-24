import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, AlertCircle } from 'lucide-react';
import client from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import '../components/ui/ui.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/api/auth/login', form);
      localStorage.setItem('token', data.token);
      navigate('/razas');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Credenciales incorrectas. Revisá usuario y contraseña.');
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

        <h1 className="auth-title">Bienvenido</h1>
        <p className="auth-subtitle">Ingresá a tu cuenta para continuar</p>

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
            placeholder="Tu nombre de usuario"
            required
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <div style={{ marginTop: 8 }}>
            <Button type="submit" loading={loading} fullWidth size="lg">
              Ingresar
            </Button>
          </div>
        </form>

        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/register">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}
