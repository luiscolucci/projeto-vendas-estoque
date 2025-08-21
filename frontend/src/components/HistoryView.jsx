import { useState, useEffect } from 'react';
import './HistoryView.css'; // Criaremos este CSS

export default function HistoryView() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/vendas', { cache: 'no-cache' })
      .then(response => response.json())
      .then(data => {
        setSales(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar histórico de vendas:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Carregando histórico...</div>;
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