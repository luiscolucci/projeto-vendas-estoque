import { useState, useEffect } from 'react';
import SalesView from './components/SalesView';
import HistoryView from './components/HistoryView';
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView';
import UserManagementView from './components/UserManagementView';
import LoginView from './components/LoginView';
import { useAuth } from './context/AuthContext';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('sales');
  const [products, setProducts] = useState([]);
  const { user, role, loading, logout } = useAuth();
  // --- CORREÇÃO AQUI ---
  const { authenticatedFetch, token } = useAuthenticatedFetch();

  const fetchProducts = async () => {
    if (user && token) {
      try {
        const response = await authenticatedFetch('/api/produtos', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchProducts();
    }
  }, [user, token]);

  if (loading || !token) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="app-container">
        <header>
          <h1>Lume Cume - Aromaterapia</h1>
        </header>
        <main>
          <LoginView />
        </main>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Lume Cume - Aromaterapia</h1>
        <nav>
          {role === 'admin' && (
            <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'active' : ''}>
              Dashboard
            </button>
          )}
          <button onClick={() => setActiveView('sales')} className={activeView === 'sales' ? 'active' : ''}>
            Frente de Caixa
          </button>
          {role === 'admin' && (
            <button onClick={() => setActiveView('history')} className={activeView === 'history' ? 'active' : ''}>
              Histórico de Vendas
            </button>
          )}
          {role === 'admin' && (
            <button onClick={() => setActiveView('products')} className={activeView === 'products' ? 'active' : ''}>
              Produtos
            </button>
          )}
          {role === 'admin' && (
            <button onClick={() => setActiveView('users')} className={activeView === 'users' ? 'active' : ''}>
              Usuários
            </button>
          )}
          <button onClick={logout} className="logout-button">
            Sair
          </button>
        </nav>
      </header>
      
      <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
        <DashboardView role={role} />
      </div>
      <div style={{ display: activeView === 'sales' ? 'block' : 'none' }}>
        <SalesView products={products} fetchProducts={fetchProducts} />
      </div>
      <div style={{ display: activeView === 'history' ? 'block' : 'none' }}>
        <HistoryView role={role} />
      </div>
      <div style={{ display: activeView === 'products' ? 'block' : 'none' }}>
        <ProductManagementView products={products} fetchProducts={fetchProducts} />
      </div>
      <div style={{ display: activeView === 'users' ? 'block' : 'none' }}>
        <UserManagementView />
      </div>
    </div>
  );
}

export default App;