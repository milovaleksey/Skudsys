import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

function AppContent() {
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Синхронизируем состояние с AuthContext
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainPage />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}