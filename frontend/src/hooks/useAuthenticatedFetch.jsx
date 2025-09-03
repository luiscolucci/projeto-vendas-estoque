import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { getIdToken } from 'firebase/auth';

export const useAuthenticatedFetch = () => {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true; // Para evitar atualizações em estado após desmontagem

    const fetchToken = async () => {
      try {
        console.log('useAuthenticatedFetch: Verificando usuário autenticado...');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await getIdToken(currentUser);
          if (mounted) {
            console.log('useAuthenticatedFetch: Token obtido:', idToken);
            setToken(idToken);
            setError(null);
          }
        } else {
          if (mounted) {
            console.log('useAuthenticatedFetch: Nenhum usuário autenticado.');
            setToken(null);
            setError(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('useAuthenticatedFetch: Erro ao obter token:', err);
          setError(err.message);
          setToken(null);
        }
      }
    };

    fetchToken();

    // Limpeza
    return () => {
      mounted = false;
      console.log('useAuthenticatedFetch: Cleanup executado.');
    };
  }, [auth.currentUser]); // Reage a mudanças no usuário autenticado

  const authenticatedFetch = async (url, options = {}) => {
    if (!token) throw new Error('Nenhum token disponível para autenticação.');
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    return response;
  };

  return { authenticatedFetch, token, error };
};