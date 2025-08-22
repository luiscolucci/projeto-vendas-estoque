import { useState } from 'react';
import { getAuth } from "firebase/auth";
import './SalesView.css';

export default function SalesView({ products, fetchProducts }) {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [creditType, setCreditType] = useState("avista");
  const [installments, setInstallments] = useState(1);
  const auth = getAuth();

  // Adiciona item ao carrinho
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

  // Atualiza quantidade
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

  // Finalizar venda
  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }

    const salePayload = {
      pagamento: {
        metodo: paymentMethod,
        parcelas: paymentMethod === "Crédito" && creditType === "parcelado" ? installments : 1,
        tipoCredito: paymentMethod === "Crédito" ? creditType : null
      },
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
      setPaymentMethod("Dinheiro");
      setCreditType("avista");
      setInstallments(1);
      fetchProducts();
    } catch (error) {
      alert(`Erro ao finalizar a venda: ${error.message}`);
    }
  };

  // 🧮 Total do carrinho
  const totalVenda = cart.reduce(
    (acc, item) => acc + (item.precoVenda ?? item.preco ?? 0) * item.quantidade,
    0
  );

  return (
    <main className="sales-view">
      <div className="product-selection">
        <h3>Produtos</h3>
        <div className="product-list-sales">
          {products.map(product => {
            const itemInCart = cart.find(item => item.id === product.id);
            const quantityInCart = itemInCart ? itemInCart.quantidade : 0;
            const availableStock =
              (product.quantidadeEstoque ?? product.estoque ?? 0) - quantityInCart;
            const preco = product.precoVenda ?? product.preco ?? 0;

            return (
              <div key={product.id} className="product-item-sales">
                <span>
                  {product.nome} (Estoque: {availableStock}) — R$ {preco.toFixed(2)}
                </span>
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
                <span className="cart-item-name">
                  {item.nome} — R$ {(item.precoVenda ?? item.preco ?? 0).toFixed(2)}
                </span>
                <div className="quantity-selector">
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                  <span>{item.quantidade}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL DESTACADO */}
        <div className="cart-total">
          <strong>Total: R$ {totalVenda.toFixed(2)}</strong>
        </div>

        {/* FORMA DE PAGAMENTO */}
        <div className="payment-section">
          <label htmlFor="paymentMethod">Forma de Pagamento:</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="Débito">Débito</option>
            <option value="Crédito">Crédito</option>
            <option value="Pix">Pix</option>
          </select>

          {paymentMethod === "Crédito" && (
            <div className="credit-options">
              <label>
                Tipo:
                <select
                  value={creditType}
                  onChange={(e) => setCreditType(e.target.value)}
                >
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </label>

              {creditType === "parcelado" && (
                <label>
                  Parcelas:
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  />
                </label>
              )}
            </div>
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
