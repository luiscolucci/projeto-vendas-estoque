import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { useAuth } from '../context/AuthContext';
import './HistoryView.css';

export default function HistoryView() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const { authenticatedFetch, token } = useAuthenticatedFetch();
  const { user } = useAuth();

  useEffect(() => {
    // Só tenta buscar os dados se o usuário estiver logado E o token estiver pronto
    if (user && token) {
      authenticatedFetch('http://localhost:5000/api/vendas', { cache: 'no-cache' })
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
  }, [user, token]); // O useEffect roda novamente quando o token for carregado

  if (loading || !token) {
    return <div>Carregando histórico...</div>;
  }

  if (!sales || sales.status === 'erro') {
    return <div>Não foi possível carregar as vendas.</div>;
  }

  return (
    <div className="history-view">
      <h2>Histórico de Vendas</h2>
      {sales.length === 0 ? (
        <p>Nenhuma venda registrada ainda.</p>
      ) : (
        <div className="sales-list">
          {sales.map(sale => (
            <div key={sale.id} className="sale-card">
              <div className="sale-header">
                <strong>Venda ID:</strong> {sale.id} <br />
                <strong>Data:</strong> {new Date(sale.dataVenda).toLocaleString('pt-BR')}
              </div>
              <div className="sale-body">
                <ul>
                  {sale.itens.map(item => (
                    <li key={item.produtoId}>
                      {item.quantidade}x {item.nomeProduto} - R$ {item.precoUnitarioVenda.toFixed(2)}
                    </li>
                  ))}
                </ul>
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