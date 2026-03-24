import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiBook, FiCpu, FiMessageCircle, FiFileText, FiCode, FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isFaculty } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <FiHome /> },
    { to: '/knowledge', label: 'Knowledge Hub', icon: <FiBook /> },
    { to: '/lab', label: 'Lab Resources', icon: <FiCpu /> },
    { to: '/chat', label: 'AI Assistant', icon: <FiMessageCircle /> },
    { to: '/assist', label: 'Conceptify Assist', icon: <FiFileText /> },
    { to: '/debug', label: 'Debug Helper', icon: <FiCode /> },
  ];

  if (isFaculty) {
    navItems.push({ to: '/faculty', label: 'Faculty Dashboard', icon: <FiBarChart2 /> });
  }

  return (
    <>
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/ConceptifyAI_logo.png" alt="Conceptify AI Logo" style={{ width: 28, height: 28, borderRadius: '4px' }} />
          <h1>Conceptify AI</h1>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
          <FiMenu />
        </button>
      </div>

      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src="/ConceptifyAI_logo.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: '6px' }} />
              <div>
                <h1>Conceptify AI</h1>
                <p>Intelligent Academic Assistant</p>
              </div>
            </div>
            <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>
        </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <>
            <div className="user-badge">
              <div className="user-avatar">{user.name?.[0]?.toUpperCase() || '?'}</div>
              <div className="user-info">
                <div className="name">{user.name}</div>
                <div className="role">{user.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <FiLogOut style={{ marginRight: 6 }} />
              Sign Out
            </button>
          </>
        )}
      </div>
      </aside>
    </>
  );
}
