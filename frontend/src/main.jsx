//import { StrictMode } from 'react'
//import { createRoot } from 'react-dom/client'
//import './index.css'
//import App from './App.jsx'

//createRoot(document.getElementById('root')).render(
  //<StrictMode> -> Não alterar
  //  <App />
  //</StrictMode>, -> Não alterar
//)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // Importar o provedor de autenticação

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* A aplicação inteira é envolvida pelo AuthProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);

