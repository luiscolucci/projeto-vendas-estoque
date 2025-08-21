import { useState, useEffect } from 'react';
import './SalesView.css';

export default function SalesView() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // Busca os produtos do backend
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/produtos')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Erro ao buscar produtos:', error));
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Adiciona um item ao carrinho ou incrementa sua quantidade
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

  // --- LÓGICA DO SELETOR [+] [-] ---
  // Atualiza a quantidade de um item específico no carrinho
  const handleUpdateQuantity = (productId, newQuantity) => {
    // Se a quantidade for 0 ou menos, remove o item do carrinho
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          if (newQuantity > item.quantidadeEstoque) {
            alert(`Estoque máximo atingido para ${item.nome}`);
            return item; // Não altera se exceder o estoque
          }
          return { ...item, quantidade: newQuantity };
        }
        return item;
      })
    );
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
                {/* --- BOTÕES [+] E [-] DE VOLTA --- */}
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
        >
            Finalizar Venda
        </button>
      </div>
    </main>
  );
}