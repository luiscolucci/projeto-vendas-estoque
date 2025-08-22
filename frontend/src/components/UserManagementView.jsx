import { useState } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import './UserManagementView.css'; // Criaremos este CSS

export default function UserManagementView() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor'); // Padrão é 'vendedor'
  const [message, setMessage] = useState('');
  const authenticatedFetch = useAuthenticatedFetch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await authenticatedFetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar usuário.');
      }

      setMessage(`Usuário ${nome} criado com sucesso!`);
      // Limpa o formulário
      setNome('');
      setEmail('');
      setPassword('');
      setRole('vendedor');

    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="user-management-view">
      <h2>Gerenciamento de Usuários</h2>
      <section className="form-section">
        <h3>Criar Novo Usuário</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome Completo" required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required />
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit">Criar Usuário</button>
        </form>
        {message && <p className="feedback-message">{message}</p>}
      </section>
    </div>
  );
}