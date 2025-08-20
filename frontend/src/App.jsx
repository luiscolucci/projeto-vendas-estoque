import { useState, useEffect } from 'react';
import './App.css';
import EditProductModal from './components/EditProductModal.jsx';

function App() {
  const [products, setProducts] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = () => {
    fetch('http://localhost:5000/api/produtos')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Erro ao buscar produtos:', error));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newProduct = { nome, descricao, precoVenda: parseFloat(precoVenda), precoCusto: parseFloat(precoCusto), quantidadeEstoque: parseInt(quantidadeEstoque), categoria: "Nova Categoria" };

    fetch('http://localhost:5000/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(newProduct),
    })
    .then(response => response.json())
    .then(() => {
      setNome(''); setDescricao(''); setPrecoVenda(''); setPrecoCusto(''); setQuantidadeEstoque('');
      fetchProducts(); 
    })
    .catch(error => console.error('Erro ao criar produto:', error));
  };

  const handleCheckboxChange = (productId) => {
    setSelectedProducts(prevSelected => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter(id => id !== productId);
      } else {
        return [...prevSelected, productId];
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`Tem certeza que deseja deletar ${selectedProducts.length} produto(s)?`)) {
      const deletePromises = selectedProducts.map(id => fetch(`http://localhost:5000/api/produtos/${id}`, { method: 'DELETE' }));
      Promise.all(deletePromises)
        .then(() => {
          fetchProducts();
          setSelectedProducts([]);
        })
        .catch(error => console.error('Erro ao deletar produtos:', error));
    }
  };
  
  const handleUpdateProduct = (updatedProduct) => {
    fetch(`http://localhost:5000/api/produtos/${updatedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(updatedProduct),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Produto atualizado com sucesso:', data);
      setEditingProduct(null);
      fetchProducts();
    })
    .catch(error => console.error('Erro ao atualizar produto:', error));
  };

  return (
    <div>
      <header>
        <h1>Lume Cume - Aromaterapia</h1>
        <h2>Painel de Produtos</h2>
      </header>

      <main>
        <section className="form-section">
          <h3>Cadastrar Novo Produto</h3>
          {/* O FORMULÁRIO COMPLETO ESTÁ AQUI AGORA */}
          <form onSubmit={handleSubmit}>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do Produto" required />
            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" />
            <input type="number" value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} placeholder="Preço de Venda" required step="0.01" />
            <input type="number" value={precoCusto} onChange={e => setPrecoCusto(e.target.value)} placeholder="Preço de Custo" step="0.01" />
            <input type="number" value={quantidadeEstoque} onChange={e => setQuantidadeEstoque(e.target.value)} placeholder="Estoque Inicial" required />
            <button type="submit">Salvar Produto</button>
          </form>
        </section>

        <hr />

        <section className="product-list-section">
          <div className="list-header">
            <h3>Produtos Cadastrados</h3>
            {selectedProducts.length > 0 && (
              <button onClick={handleBulkDelete} className="delete-button">
                Deletar Selecionados ({selectedProducts.length})
              </button>
            )}
          </div>
          <div className="product-list">
            {products.map(product => (
              <div key={product.id} className="product-row">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleCheckboxChange(product.id)}
                />
                <h4>{product.nome}</h4>
                <p>Estoque: {product.quantidadeEstoque}</p>
                <p>Preço: R$ {product.precoVenda}</p>
                <button onClick={() => setEditingProduct(product)} className="edit-button">
                  Editar
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleUpdateProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

export default App;