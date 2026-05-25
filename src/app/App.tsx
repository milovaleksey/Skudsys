import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TokenManager } from './lib/api';
import { Toaster } from 'sonner';

function AppContent() {
  const { user, loading, setUser } = useAuth();

  // Проверяем токен из URL (после OIDC callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refresh');

    if (token) {
      console.log('🔐 Обнаружен токен из SSO callback');

      // Сохраняем токены через TokenManager
      TokenManager.setToken(token);
      if (refreshToken) {
        TokenManager.setRefreshToken(refreshToken);
      }

      // Очищаем URL от параметров
      window.history.replaceState({}, document.title, window.location.pathname);

      // Получаем информацию о пользователе
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const baseUrl = apiUrl || window.location.origin;

      fetch(`${baseUrl}/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('📥 Получены данные пользователя из SSO:', data);
          if (data.success && data.data) {
            console.log('✅ Устанавливаем пользователя:', data.data);
            setUser(data.data);
          } else {
            console.error('❌ Ошибка в ответе /auth/me:', data);
          }
        })
        .catch(error => {
          console.error('❌ Ошибка получения данных пользователя:', error);
        });
    }
  }, [setUser]);

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
      {!user ? (
        <LoginPage onLogin={() => {}} />
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