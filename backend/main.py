from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request

# --- INICIALIZAÇÃO ---
app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
print("🔥 Conexão com Firebase estabelecida com sucesso!")

db = firestore.client()
produtos_ref = db.collection('produtos')
vendas_ref = db.collection('vendas') # Referência para a coleção de vendas

# --- ROTAS DA API ---

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica se o backend está no ar."""
    return jsonify({"status": "ok", "message": "Backend da Lume Cume está no ar!"}), 200

# --- ROTAS DE PRODUTOS (CRUD) ---

@app.route('/api/produtos', methods=['POST'])
def criar_produto():
    """Cria um novo produto no banco de dados."""
    try:
        dados_produto = request.get_json()
        update_time, doc_ref = produtos_ref.add(dados_produto)
        print(f"✅ Produto adicionado com ID: {doc_ref.id}")
        return jsonify({"status": "sucesso", "id": doc_ref.id}), 201
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    """Lista todos os produtos do banco de dados."""
    try:
        todos_produtos = []
        for doc in produtos_ref.stream():
            produto = doc.to_dict()
            produto['id'] = doc.id
            todos_produtos.append(produto)
        return jsonify(todos_produtos), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/produtos/<string:product_id>', methods=['PUT'])
def atualizar_produto(product_id):
    """Atualiza um produto existente pelo seu ID."""
    try:
        dados_atualizacao = request.get_json()
        produtos_ref.document(product_id).update(dados_atualizacao)
        print(f"🔄 Produto atualizado com ID: {product_id}")
        return jsonify({"status": "sucesso", "id": product_id}), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/produtos/<string:product_id>', methods=['DELETE'])
def deletar_produto(product_id):
    """Deleta um produto existente pelo seu ID."""
    try:
        produtos_ref.document(product_id).delete()
        print(f"🗑️ Produto deletado com ID: {product_id}")
        return jsonify({"status": "sucesso", "id": product_id}), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

# --- ROTA DE VENDAS ---

# Substitua a sua função @app.route('/api/vendas', ...) por esta

@app.route('/api/vendas', methods=['POST'])
def registrar_venda():
    """Registra uma nova venda, atualizando o estoque de forma atômica."""
    try:
        dados_venda = request.get_json()

        @firestore.transactional
        def processar_venda(transaction):
            itens_vendidos = dados_venda.get('itens', [])
            if not itens_vendidos:
                raise Exception("A lista de itens vendidos não pode estar vazia.")

            valor_total_venda = 0
            itens_com_detalhes = []
            
            # Lista temporária para guardar as informações que lemos
            produtos_para_atualizar = []

            # --- ETAPA 1: LER TUDO PRIMEIRO ---
            # Este primeiro loop apenas lê os dados e faz as verificações.
            for item in itens_vendidos:
                produto_id = item.get('produtoId')
                quantidade_vendida = item.get('quantidade')

                produto_ref = produtos_ref.document(produto_id)
                produto_snapshot = produto_ref.get(transaction=transaction)

                if not produto_snapshot.exists:
                    raise Exception(f"Produto com ID {produto_id} não encontrado.")

                produto_data = produto_snapshot.to_dict()
                estoque_atual = produto_data.get('quantidadeEstoque', 0)

                if estoque_atual < quantidade_vendida:
                    raise Exception(f"Estoque insuficiente para o produto '{produto_data.get('nome')}'.")

                # Guarda as informações necessárias para a etapa de escrita
                produtos_para_atualizar.append({
                    "ref": produto_ref,
                    "novo_estoque": estoque_atual - quantidade_vendida
                })

                # Calcula o valor total e prepara os detalhes para o registro da venda
                valor_item = produto_data.get('precoVenda', 0) * quantidade_vendida
                valor_total_venda += valor_item
                itens_com_detalhes.append({
                    'produtoId': produto_id,
                    'nomeProduto': produto_data.get('nome'),
                    'quantidade': quantidade_vendida,
                    'precoUnitarioVenda': produto_data.get('precoVenda')
                })

            # --- ETAPA 2: ESCREVER TUDO DEPOIS ---
            # Agora que já lemos tudo, podemos fazer todas as escritas.
            
            # Atualiza o estoque de cada produto
            for prod in produtos_para_atualizar:
                transaction.update(prod["ref"], {'quantidadeEstoque': prod["novo_estoque"]})

            # Cria o registro da venda
            registro_venda = {
                'dataVenda': firestore.SERVER_TIMESTAMP,
                'vendedorId': dados_venda.get('vendedorId'),
                'vendedorNome': dados_venda.get('vendedorNome'),
                'pagamento': dados_venda.get('pagamento'),
                'itens': itens_com_detalhes,
                'valorTotal': valor_total_venda
            }
            nova_venda_ref = vendas_ref.document()
            transaction.set(nova_venda_ref, registro_venda)
            
            return nova_venda_ref.id

        # Executa a transação
        transaction = db.transaction()
        venda_id = processar_venda(transaction)
        
        print(f"💰 Venda registrada com sucesso! ID: {venda_id}")
        return jsonify({"status": "sucesso", "message": "Venda registrada com sucesso!", "vendaId": venda_id}), 201

    except Exception as e:
        print(f"❌ Erro ao registrar venda: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 400
    
# Adicione esta nova rota ao seu arquivo main.py

@app.route('/api/vendas', methods=['GET'])
def listar_vendas():
    """Busca e retorna todas as vendas registradas no banco de dados."""
    try:
        todas_vendas = []
        # O .stream() busca todos os documentos. Usamos .order_by() para trazer as mais recentes primeiro.
        vendas_stream = vendas_ref.order_by(
            'dataVenda', direction=firestore.Query.DESCENDING
        ).stream()

        for venda in vendas_stream:
            venda_data = venda.to_dict()
            # Adiciona o ID do documento da venda aos dados
            venda_data['id'] = venda.id
            
            # Converte o timestamp para uma string legível (ISO 8601)
            if 'dataVenda' in venda_data and venda_data['dataVenda']:
                 venda_data['dataVenda'] = venda_data['dataVenda'].isoformat()

            todas_vendas.append(venda_data)
            
        return jsonify(todas_vendas), 200
    except Exception as e:
        print(f"❌ Erro ao listar vendas: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 500
    
# Adicione esta nova rota ao seu arquivo main.py

from datetime import datetime, timedelta

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    Calcula e retorna os dados agregados para o dashboard.
    """
    try:
        # 1. Buscar todos os produtos para ter um mapa de ID -> precoCusto
        produtos_map = {p.id: p.to_dict() for p in produtos_ref.stream()}

        # 2. Buscar todas as vendas
        vendas = list(vendas_ref.stream())

        # 3. Calcular os totais
        faturamento_bruto = 0
        custo_total = 0
        total_itens_vendidos = 0
        vendas_por_dia = {} # Usaremos um dicionário para agrupar

        for venda in vendas:
            venda_data = venda.to_dict()
            faturamento_bruto += venda_data.get('valorTotal', 0)
            
            # Calcula o custo dos produtos para esta venda
            for item in venda_data.get('itens', []):
                produto_id = item.get('produtoId')
                quantidade = item.get('quantidade')
                total_itens_vendidos += quantidade
                
                # Busca o precoCusto do produto no mapa que criamos
                if produto_id in produtos_map:
                    custo_total += produtos_map[produto_id].get('precoCusto', 0) * quantidade

            # Agrupa as vendas por dia para o gráfico
            data_venda = venda_data.get('dataVenda')
            if data_venda:
                # Formata a data para 'ANO-MÊS-DIA'
                dia = data_venda.strftime('%Y-%m-%d')
                if dia not in vendas_por_dia:
                    vendas_por_dia[dia] = 0
                vendas_por_dia[dia] += venda_data.get('valorTotal', 0)

        lucro_liquido = faturamento_bruto - custo_total
        
        # Converte o dicionário de vendas por dia em uma lista ordenada
        vendas_por_dia_lista = sorted(
            [{"data": dia, "total": total} for dia, total in vendas_por_dia.items()],
            key=lambda x: x['data']
        )

        # 4. Monta o objeto de resposta
        dashboard_data = {
            "resumo": {
                "faturamentoBruto": faturamento_bruto,
                "lucroLiquido": lucro_liquido,
                "totalVendas": len(vendas),
                "totalItensVendidos": total_itens_vendidos
            },
            "vendasPorDia": vendas_por_dia_lista
        }
        
        return jsonify(dashboard_data), 200

    except Exception as e:
        print(f"❌ Erro ao gerar dados do dashboard: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 500
    
# --- PONTO DE ENTRADA ---

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)