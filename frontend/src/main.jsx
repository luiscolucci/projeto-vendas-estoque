import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // Importar o provedor de autenticação

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Depuração visível */}
    <div style={{ color: 'red', fontSize: '24px', padding: '20px', background: 'yellow' }}>
      TESTE: Renderização OK! Verifique o console para estado de autenticação.
    </div>
    {/* A aplicação inteira é envolvida pelo AuthProvider */}
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