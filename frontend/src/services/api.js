import { getAuth } from 'firebase/auth';

// A variável de ambiente é lida APENAS AQUI.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Uma função centralizada para fazer chamadas autenticadas para a sua API.
 * Ela automaticamente pega o token do usuário logado.
 * @param {string} endpoint - O endpoint da API (ex: '/produtos', '/vendas').
 * @param {object} options - Opções adicionais para o fetch (ex: method, body).
 * @returns {Promise<any>} - A resposta da API em JSON.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Erro na requisição à API.');
  }

  return response.json();
};