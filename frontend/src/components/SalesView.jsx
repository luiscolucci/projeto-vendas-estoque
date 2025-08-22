import { useState } from 'react';
import { getAuth } from "firebase/auth";
import './SalesView.css';

export default function SalesView({ products, fetchProducts }) {
  const [cart, setCart] = useState([]);
  const auth = getAuth();

  // Adiciona um item ao carrinho ou incrementa sua quantidade
  const handleAddToCart = (productToAdd) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productToAdd.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === productToAdd.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...productToAdd, quantidade: 1 }];
      }
    });
  };

  // Atualiza a quantidade de um item específico no carrinho
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantidade: newQuantity } : item
        )
      );
    }
  };

  // Finaliza a venda, enviando os dados para o backend
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }

    const salePayload = {
      pagamento: { metodo: "Dinheiro", parcelas: 1 },
      itens: cart.map(item => ({
        produtoId: item.id,
        quantidade: item.quantidade
      }))
    };

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/vendas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      await response.json();
      alert('Venda registrada com sucesso!');
      setCart([]);
      fetchProducts(); // Atualiza os produtos na tela
    } catch (error) {
      alert(`Erro ao finalizar a venda: ${error.message}`);
    }
  };

  return (
    <main className="sales-view">
      <div className="product-selection">
        <h3>Produtos</h3>
        <div className="product-list-sales">
          {products.map(product => {
            const itemInCart = cart.find(item => item.id === product.id);
            const quantityInCart = itemInCart ? itemInCart.quantidade : 0;

            // Aceita tanto "quantidadeEstoque" quanto "estoque"
            const availableStock =
              (product.quantidadeEstoque ?? product.estoque ?? 0) - quantityInCart;

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
