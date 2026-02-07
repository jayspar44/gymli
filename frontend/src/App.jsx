import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProfileProvider, useUserProfile } from './contexts/UserProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Today from './pages/Today';
import Log from './pages/Log';
import Progress from './pages/Progress';
import Profile from './pages/Profile';

function OnboardingGate({ children }) {
  const { needsOnboarding, loading } = useUserProfile();
  if (loading) return null;
  if (needsOnboarding) return <Navigate to="/profile" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserProfileProvider>
                <Layout />
              </UserProfileProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<OnboardingGate><Today /></OnboardingGate>} />
          <Route path="log" element={<OnboardingGate><Log /></OnboardingGate>} />
          <Route path="progress" element={<OnboardingGate><Progress /></OnboardingGate>} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
