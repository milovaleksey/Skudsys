import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { MainPage } from './components/MainPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Изменено на true для быстрого просмотра

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainPage />
      )}
    </>
  );
}