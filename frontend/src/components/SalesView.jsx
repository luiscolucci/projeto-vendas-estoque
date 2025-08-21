import { useState } from 'react';
import './SalesView.css';

// O componente agora recebe 'products' e 'fetchProducts' do seu pai (App.jsx)
export default function SalesView({ products, fetchProducts }) {
  const [cart, setCart] = useState([]);

  const handleAddToCart = (productToAdd) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productToAdd.id);
      if (existingItem) {
        const newQuantity = existingItem.quantidade + 1;
        if (newQuantity > existingItem.quantidadeEstoque) {
            alert(`Estoque máximo atingido para ${existingItem.nome}`);
            return prevCart;
        }
        return prevCart.map(item =>
          item.id === productToAdd.id ? { ...item, quantidade: newQuantity } : item
        );
      }
      return [...prevCart, { ...productToAdd, quantidade: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          if (newQuantity > item.quantidadeEstoque) {
            alert(`Estoque máximo atingido para ${item.nome}`);
            return item;
          }
          return { ...item, quantidade: newQuantity };
        }
        return item;
      })
    );
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }
    const salePayload = {
      vendedorId: "user_01",
      vendedorNome: "Admin",
      pagamento: { metodo: "Dinheiro", parcelas: 1 },
      itens: cart.map(item => ({ produtoId: item.id, quantidade: item.quantidade }))
    };

    fetch('http://localhost:5000/api/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(salePayload),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message) });
      }
      return response.json();
    })
    .then(data => {
      alert('Venda registrada com sucesso!');
      setCart([]);
      // AVISAMOS O COMPONENTE PAI PARA ATUALIZAR A LISTA DE PRODUTOS
      fetchProducts(); 
    })
    .catch(error => {
      alert(`Erro ao finalizar a venda: ${error.message}`);
    });
  };
  
  return (
    <main className="sales-view">
      <div className="product-selection">
        <h3>Produtos</h3>
        <div className="product-list-sales">
          {products.map(product => {
            const itemInCart = cart.find(item => item.id === product.id);
            const quantityInCart = itemInCart ? itemInCart.quantidade : 0;
            const availableStock = product.quantidadeEstoque - quantityInCart;

            return (
              <div key={product.id} className="product-item-sales">
                <span>{product.nome} (Estoque: {availableStock})</span>
                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={availableStock <= 0}
                >
                  Adicionar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-section">
        <h3>🛒 Carrinho</h3>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p>O carrinho está vazio.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <span className="cart-item-name">{item.nome}</span>
                <div className="quantity-selector">
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                  <span>{item.quantidade}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        <button 
            className="finalize-sale-button" 
            disabled={cart.length === 0}
            onClick={handleFinalizeSale}
        >
            Finalizar Venda
        </button>
      </div>
    </main>
  );
}