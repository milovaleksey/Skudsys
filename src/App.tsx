import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Изменено на true для быстрого просмотра

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainPage />
      )}
    </AuthProvider>
  );
}