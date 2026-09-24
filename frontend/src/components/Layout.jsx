import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Tag,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Scan,
  Home,
} from 'lucide-react';
import './ui/ui.css';

const NAV_ITEMS = [
  { to: '/',               label: 'Inicio',            icon: Home, end: true },
  { to: '/razas',          label: 'Razas',             icon: Tag  },
  { to: '/trabajo-mangas', label: 'Trabajo de Mangas', icon: Scan },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const username = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || '';
    } catch {
      return '';
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={s.root}>
      {/* Navbar */}
      <header style={s.navbar}>
        <div style={s.navLeft}>
          <button
            style={s.hamburger}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menú"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={s.brand}>
            <div style={s.brandIcon}>
              <Leaf size={16} />
            </div>
            <span style={s.brandName}>Genetics</span>
          </div>
        </div>

        <div style={s.navRight}>
          {username && (
            <span style={s.userChip}>
              {username.charAt(0).toUpperCase()}
              <span style={s.userName}>{username}</span>
            </span>
          )}
          <button style={s.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} />
            <span style={s.logoutLabel}>Salir</span>
          </button>
        </div>
      </header>

      <div style={s.body}>
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div style={s.overlay} onClick={closeSidebar} />
        )}

        {/* Sidebar */}
        <aside style={{ ...s.sidebar, ...(sidebarOpen ? s.sidebarOpen : {}) }}>
          <nav style={s.nav}>
            <p style={s.navSection}>Menú</p>
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                onClick={closeSidebar}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}

            <p style={{ ...s.navSection, marginTop: 24 }}>Próximamente</p>
            {['Reportes'].map((item) => (
              <div key={item} style={s.comingSoon}>
                <ChevronRight size={14} style={{ opacity: 0.4 }} />
                <span>{item}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <main style={s.content}>{children}</main>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 'var(--navbar-height)',
    background: 'var(--color-primary)',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  hamburger: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    padding: 6,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: '-0.01em',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '4px 12px 4px 8px',
    fontSize: 13,
    fontWeight: 500,
  },
  userName: {
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: 'var(--radius-md)',
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  },
  logoutLabel: {
    display: 'inline',
  },
  body: {
    display: 'flex',
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 20,
    top: 'var(--navbar-height)',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    padding: '20px 12px',
    flexShrink: 0,
    position: 'sticky',
    top: 'var(--navbar-height)',
    height: 'calc(100vh - var(--navbar-height))',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    /* hidden on mobile, shown via sidebarOpen */
    '@media (max-width: 768px)': {
      position: 'fixed',
      left: -280,
    },
  },
  sidebarOpen: {
    position: 'fixed',
    left: 0,
    top: 'var(--navbar-height)',
    height: 'calc(100vh - var(--navbar-height))',
    zIndex: 30,
    boxShadow: 'var(--shadow-lg)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navSection: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-text-disabled)',
    padding: '0 12px',
    marginBottom: 4,
    marginTop: 4,
  },
  comingSoon: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    color: 'var(--color-text-disabled)',
    userSelect: 'none',
    cursor: 'default',
  },
  content: {
    flex: 1,
    padding: '32px 36px',
    minWidth: 0,
    maxWidth: 1200,
  },
};
