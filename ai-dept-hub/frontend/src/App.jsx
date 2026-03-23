import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import KnowledgeHub from './pages/KnowledgeHub';
import LabHub from './pages/LabHub';
import AiChat from './pages/AiChat';
import DebugHelper from './pages/DebugHelper';
import FacultyDashboard from './pages/FacultyDashboard';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function FacultyRoute({ children }) {
  const { isFaculty, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return isFaculty ? children : <Navigate to="/" />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><KnowledgeHub /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><LabHub /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
              <Route path="/debug" element={<ProtectedRoute><DebugHelper /></ProtectedRoute>} />
              <Route path="/faculty" element={<FacultyRoute><FacultyDashboard /></FacultyRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  );
}
