import { useState, useEffect } from 'react';

// Este é o nosso novo componente! Note que ele recebe "props" (propriedades) do componente pai.
function EditProductModal({ product, onSave, onClose }) {
  // Estado interno do formulário, inicializado com os dados do produto que estamos editando
  const [formData, setFormData] = useState({ ...product });

  // Atualiza o estado do formulário se o produto a ser editado mudar
  useEffect(() => {
    setFormData({ ...product });
  }, [product]);

  // Função para lidar com mudanças nos inputs do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Função para salvar as alterações
  const handleSubmit = (e) => {
    e.preventDefault();
    // Converte os valores para números antes de salvar
    const updatedProduct = {
      ...formData,
      precoVenda: parseFloat(formData.precoVenda),
      precoCusto: parseFloat(formData.precoCusto),
      quantidadeEstoque: parseInt(formData.quantidadeEstoque),
    };
    onSave(updatedProduct);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Editar Produto</h2>
        <form onSubmit={handleSubmit}>
          <label>Nome:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />

          <label>Descrição:</label>
          <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} />

          <label>Preço de Venda:</label>
          <input type="number" name="precoVenda" value={formData.precoVenda} onChange={handleChange} required />

          <label>Preço de Custo:</label>
          <input type="number" name="precoCusto" value={formData.precoCusto} onChange={handleChange} />

          <label>Estoque:</label>
          <input type="number" name="quantidadeEstoque" value={formData.quantidadeEstoque} onChange={handleChange} required />

          <div className="modal-actions">
            <button type="submit">Salvar Alterações</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;