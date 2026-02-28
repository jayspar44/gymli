import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flame } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-bg)]">
        <div className="relative mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
            <Flame className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
