import { useState, useEffect } from 'react';
import SalesView from './components/SalesView';
import HistoryView from './components/HistoryView';
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView'; // Importar
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [products, setProducts] = useState([]);

  const fetchProducts = () => {
    fetch('http://localhost:5000/api/produtos', { cache: 'no-cache' })
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Erro ao buscar produtos:', error));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <header>
        <h1>Lume Cume - Aromoterapia</h1>
        <nav>
           <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'active' : ''}>
            Dashboard
          </button>
          <button onClick={() => setActiveView('sales')} className={activeView === 'sales' ? 'active' : ''}>
            Frente de Caixa
          </button>
           <button onClick={() => setActiveView('history')} className={activeView === 'history' ? 'active' : ''}>
            Histórico de Vendas
          </button>
          {/* Nova Aba */}
          <button onClick={() => setActiveView('products')} className={activeView === 'products' ? 'active' : ''}>
            Produtos
          </button>
        </nav>
      </header>
      
      <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
        <DashboardView />
      </div>
      <div style={{ display: activeView === 'sales' ? 'block' : 'none' }}>
        <SalesView products={products} fetchProducts={fetchProducts} />
      </div>
      <div style={{ display: activeView === 'history' ? 'block' : 'none' }}>
        <HistoryView />
      </div>
      {/* Nova Tela */}
      <div style={{ display: activeView === 'products' ? 'block' : 'none' }}>
        <ProductManagementView products={products} fetchProducts={fetchProducts} />
      </div>
    </div>
  );
}

export default App;