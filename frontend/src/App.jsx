import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProfileProvider, useUserProfile } from './contexts/UserProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Today from './pages/Today';
import Log from './pages/Log';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import PlanSetup from './pages/PlanSetup';

function OnboardingGate({ children }) {
  const { needsOnboarding, loading } = useUserProfile();
  if (loading) return null;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <UserProfileProvider>
              <Onboarding />
            </UserProfileProvider>
          </ProtectedRoute>
        } />
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
          <Route path="plan-setup" element={<OnboardingGate><PlanSetup /></OnboardingGate>} />
        </Route>
      </Routes>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
