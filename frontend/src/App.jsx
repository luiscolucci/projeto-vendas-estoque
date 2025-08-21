import { useState, useEffect } from 'react';
import SalesView from './components/SalesView';
import HistoryView from './components/HistoryView';
import DashboardView from './components/DashboardView';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  
  // O ESTADO DOS PRODUTOS AGORA VIVE AQUI, NO COMPONENTE PAI!
  const [products, setProducts] = useState([]);

  // A FUNÇÃO PARA BUSCAR PRODUTOS AGORA VIVE AQUI
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/produtos', { cache: 'no-cache' })
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Erro ao buscar produtos:', error));
  };

  // BUSCA OS PRODUTOS QUANDO O APP CARREGA
  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <div>
      <header>
        <h1>Lume Cume - Aromaterapia</h1>
        <nav>
           {/* 3. Adicionar o novo botão */}
          <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'active' : ''}>
            Dashboard
          </button>
          <button onClick={() => setActiveView('sales')} className={activeView === 'sales' ? 'active' : ''}>
            Frente de Caixa
          </button>
          <button onClick={() => setActiveView('history')} className={activeView === 'history' ? 'active' : ''}>
            Histórico de Vendas
          </button>
        </nav>
      </header>
      
      {/* 4. Adicionar a nova visualização */}
      <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
        <DashboardView />
      </div>
      <div style={{ display: activeView === 'sales' ? 'block' : 'none' }}>
        <SalesView products={products} fetchProducts={fetchProducts} />
      </div>
      <div style={{ display: activeView === 'history' ? 'block' : 'none' }}>
        <HistoryView />
      </div>
    </div>
  );
}

export default App;