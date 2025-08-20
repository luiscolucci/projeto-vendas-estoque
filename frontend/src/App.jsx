import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');

  // --- NOVIDADE: Estado para rastrear os produtos selecionados ---
  const [selectedProducts, setSelectedProducts] = useState([]);

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

  // --- NOVIDADE: Função para lidar com a mudança do checkbox ---
  const handleCheckboxChange = (productId) => {
    setSelectedProducts(prevSelected => {
      // Se o ID já está na lista, removemos (desmarcar)
      if (prevSelected.includes(productId)) {
        return prevSelected.filter(id => id !== productId);
      }
      // Se não está, adicionamos (marcar)
      else {
        return [...prevSelected, productId];
      }
    });
  };

  // --- NOVIDADE: Função para deletar os produtos selecionados ---
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      alert('Por favor, selecione ao menos um produto para deletar.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja deletar ${selectedProducts.length} produto(s)?`)) {
      // Criamos uma promessa de deleção para cada produto selecionado
      const deletePromises = selectedProducts.map(productId =>
        fetch(`http://localhost:5000/api/produtos/${productId}`, {
          method: 'DELETE',
        })
      );

      // Promise.all espera todas as promessas terminarem
      Promise.all(deletePromises)
        .then(() => {
          console.log('Produtos selecionados deletados com sucesso.');
          fetchProducts(); // Atualiza a lista de produtos
          setSelectedProducts([]); // Limpa a seleção
        })
        .catch(error => console.error('Erro ao deletar produtos:', error));
    }
  };

  return (
    <div>
      <header>
        <h1>Lume Cume - Aromaterapia</h1>
        <h2>Painel de Produtos</h2>
      </header>

      <main>
        {/* ... (Seção do formulário continua igual) ... */}
        <section className="form-section">
          <h3>Cadastrar Novo Produto</h3>
          {/* ... (o código do form não muda) ... */}
        </section>

        <hr />

        <section className="product-list-section">
          <div className="list-header">
            <h3>Produtos Cadastrados</h3>
            {/* --- NOVIDADE: O botão de deletar só aparece se houver itens selecionados --- */}
            {selectedProducts.length > 0 && (
              <button onClick={handleBulkDelete} className="delete-button">
                Deletar Selecionados ({selectedProducts.length})
              </button>
            )}
          </div>
          <div className="product-list">
            {products.map(product => (
              // Apenas renomeamos a classe aqui de "product-card" para "product-row"
              <div key={product.id} className="product-row">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleCheckboxChange(product.id)}
                />
                <h4>{product.nome}</h4>
                <p>Estoque: {product.quantidadeEstoque}</p>
                <p>Preço: R$ {product.precoVenda}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;