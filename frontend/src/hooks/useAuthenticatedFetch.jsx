import { useAuth } from '../context/AuthContext';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';

export const useAuthenticatedFetch = () => {
  const { user } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(idToken => {
        setToken(idToken);
      });
    }
  }, [user]);

  const authenticatedFetch = (url, options = {}) => {
    if (!user || !token) {
      console.error("Usuário não autenticado ou token não disponível.");
      throw new Error("Não autenticado.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };

    return fetch(url, { ...options, headers });
  };

  return { authenticatedFetch, token };
};