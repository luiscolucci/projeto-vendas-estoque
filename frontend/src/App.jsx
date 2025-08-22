import UserManagementView from './components/UserManagementView';
import { useState, useEffect } from 'react';
import SalesView from './components/SalesView';
import HistoryView from './components/HistoryView';
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView';
import LoginView from './components/LoginView';
import { useAuth } from './context/AuthContext';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const { user, role, loading, logout } = useAuth();
  const { authenticatedFetch, token } = useAuthenticatedFetch(); // Usamos o hook aqui!

  const fetchProducts = async () => {
    if (token) {
        try {
            const response = await authenticatedFetch('http://localhost:5000/api/produtos', {
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
  }, [user, token]); // Roda quando o user OU o token mudam

  if (loading || !token) { // Espera o token carregar antes de renderizar
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
        <DashboardView />
      </div>
      <div style={{ display: activeView === 'sales' ? 'block' : 'none' }}>
        <SalesView products={products} fetchProducts={fetchProducts} />
      </div>
      <div style={{ display: activeView === 'history' ? 'block' : 'none' }}>
        <HistoryView />
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