import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flame } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0a09]">
        <div className="relative mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4872a] to-[#96501d]">
            <Flame className="w-6 h-6 text-[#fdf8f0]" strokeWidth={1.5} />
          </div>
          <div className="absolute -inset-3 rounded-2xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(212,135,42,0.15) 0%, transparent 70%)' }} />
        </div>
        <p className="text-sm text-[#78716c] tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
