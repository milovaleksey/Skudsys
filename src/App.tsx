import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

function AppContent() {
  const { user, loading } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Синхронизируем состояние с AuthContext
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Показываем загрузку пока проверяем токен
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00aeef' }}></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

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