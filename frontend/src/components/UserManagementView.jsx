import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { useAuth } from '../context/AuthContext';
import './UserManagementView.css';

export default function UserManagementView() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // CORREÇÃO: Usamos a desestruturação para pegar a função e o token do hook
  const { authenticatedFetch, token } = useAuthenticatedFetch();
  const { user, role: userRole } = useAuth();

  const fetchUsers = () => {
    setLoading(true);
    if (user && token && userRole === 'admin') {
      authenticatedFetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setUsers(data);
          } else {
            setUsers([]);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error("Erro ao buscar usuários:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, token, userRole]);

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
      setNome(''); setEmail(''); setPassword(''); setRole('vendedor');
      fetchUsers();
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  };

  const handleToggleUserStatus = async (uid, isDisabled) => {
    const action = isDisabled ? 'enable' : 'disable';
    if (window.confirm(`Tem certeza que deseja ${isDisabled ? 'desbloquear' : 'bloquear'} este usuário?`)) {
        try {
            const response = await authenticatedFetch(`/api/users/${uid}/${action}`, {
                method: 'PUT',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage(data.message);
            fetchUsers();
        } catch (error) {
            setMessage(`Erro: ${error.message}`);
        }
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (userRole !== 'admin') {
    return <div className="no-access-message">Acesso negado: Somente administradores podem gerenciar usuários.</div>;
  }

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

      <hr />

      <section className="user-list-section">
        <h3>Usuários Cadastrados</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td>{user.nome || 'N/A'}</td>
                <td>{user.email}</td>
                <td>{user.disabled ? 'Bloqueado' : 'Ativo'}</td>
                <td>
                  <button 
                    className={user.disabled ? 'enable-button' : 'disable-button'}
                    onClick={() => handleToggleUserStatus(user.uid, user.disabled)}
                  >
                    {user.disabled ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}