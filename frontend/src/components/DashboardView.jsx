import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { useAuth } from '../context/AuthContext';
import './DashboardView.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { authenticatedFetch, token } = useAuthenticatedFetch();
  const { user } = useAuth();

  useEffect(() => {
    // Só tenta buscar os dados se o usuário estiver logado E o token estiver pronto
    if (user && token) {
      authenticatedFetch('http://localhost:5000/api/dashboard-data', { cache: 'no-cache' })
      .then(res => res.json())
      .then(apiData => {
        setData(apiData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar dados do dashboard:", error);
        setLoading(false);
      });
    }
  }, [user, token]); // O useEffect roda novamente quando o token for carregado

  if (loading || !token) {
    return <div>Carregando dados do dashboard...</div>;
  }
  
  if (!data || data.status === 'erro') {
    return <div>Não foi possível carregar os dados.</div>;
  }

  const chartData = {
    labels: data.vendasPorDia.map(v => new Date(v.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})),
    datasets: [
      {
        label: 'Faturamento por Dia (R$)',
        data: data.vendasPorDia.map(v => v.total),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="dashboard-view">
      <h2>Resumo Geral</h2>
      <div className="summary-cards">
        <div className="card">
          <h4>Faturamento Bruto</h4>
          <p>R$ {data.resumo.faturamentoBruto.toFixed(2)}</p>
        </div>
        <div className="card">
          <h4>Lucro Líquido</h4>
          <p>R$ {data.resumo.lucroLiquido.toFixed(2)}</p>
        </div>
        <div className="card">
          <h4>Total de Vendas</h4>
          <p>{data.resumo.totalVendas}</p>
        </div>
         <div className="card">
          <h4>Itens Vendidos</h4>
          <p>{data.resumo.totalItensVendidos}</p>
        </div>
      </div>

      <h2>Desempenho de Vendas</h2>
      <div className="chart-container">
        <Line data={chartData} />
      </div>
    </div>
  );
}