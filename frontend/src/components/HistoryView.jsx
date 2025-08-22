import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { useAuth } from '../context/AuthContext';
import './HistoryView.css';

export default function HistoryView({ role }) {
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]); // Novo estado para a lista de usuários
  const [loading, setLoading] = useState(true);

  // Novos estados para os filtros
  const [filterSeller, setFilterSeller] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const { authenticatedFetch, token } = useAuthenticatedFetch();
  const { user } = useAuth();

  const fetchSales = () => {
    setLoading(true);
    let url = 'http://localhost:5000/api/vendas?';
    if (filterSeller) {
      url += `sellerId=${filterSeller}&`;
    }
    if (filterDate) {
      url += `date=${filterDate}&`;
    }

    if (user && token) {
      authenticatedFetch(url, { cache: 'no-cache' })
        .then(response => response.json())
        .then(data => {
          setSales(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Erro ao buscar histórico de vendas:", error);
          setLoading(false);
        });
    }
  };

  const fetchUsers = () => {
    if (user && token && role === 'admin') {
      authenticatedFetch('/api/users')
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(error => console.error("Erro ao buscar usuários:", error));
    }
  };

  // Carrega as vendas e os usuários quando o componente monta e quando os filtros mudam
  useEffect(() => {
    fetchSales();
    fetchUsers();
  }, [user, token, filterSeller, filterDate]);

  if (loading || !token) {
    return <div>Carregando histórico...</div>;
  }

  if (sales.status === 'erro') {
    return <div>Não foi possível carregar as vendas.</div>;
  }
  
  return (
    <div className="history-view">
      <h2>Histórico de Vendas</h2>
      
      {/* --- CAMPOS DE FILTRO --- */}
      <div className="filter-controls">
        <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)}>
          <option value="">Todos os Vendedores</option>
          {users.map(u => (
            <option key={u.uid} value={u.uid}>{u.nome || u.email}</option>
          ))}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <button onClick={() => { setFilterSeller(''); setFilterDate(''); }}>Limpar Filtros</button>
      </div>

      {sales.length === 0 ? (
        <p>Nenhuma venda registrada ainda.</p>
      ) : (
        <div className="sales-list">
          {sales.map(sale => (
            <div key={sale.id} className="sale-card">
              <div className="sale-header">
                <strong>Data:</strong> {new Date(sale.dataVenda).toLocaleString('pt-BR')} <br />
                <strong>Vendedor:</strong> {sale.vendedorNome || 'N/A'}
              </div>
              <div className="sale-body">
                <strong>Itens:</strong>
                <ul>
                  {sale.itens.map(item => (
                    <li key={item.produtoId}>
                      {item.quantidade}x {item.nomeProduto} - R$ {item.precoUnitarioVenda.toFixed(2)}
                    </li>
                  ))}
                </ul>
                <div className="payment-details">
                  <strong>Pagamento:</strong> {sale.pagamento.metodo}
                  {sale.pagamento.metodo === 'Crédito' && (
                    <span> - {sale.pagamento.tipoCredito === 'avista' ? 'À vista' : `Parcelado em ${sale.pagamento.parcelas}x`}</span>
                  )}
                </div>
              </div>
              <div className="sale-footer">
                <strong>Total: R$ {sale.valorTotal.toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}