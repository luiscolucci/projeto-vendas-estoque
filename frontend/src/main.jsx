import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // Importar o provedor de autenticação

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </React.StrictMode>,
);

// Depuração no console
if (window) {
  console.log('main.jsx: Renderização iniciada');
  console.log('AuthProvider disponível:', typeof AuthProvider === 'function');
}