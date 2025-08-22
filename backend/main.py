import os
from datetime import datetime
from functools import wraps

import firebase_admin
from firebase_admin import auth, credentials, firestore
from flask import Flask, jsonify, request, g
from flask_cors import CORS

# --- INICIALIZAÇÃO ---
app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
print("🔥 Conexão com Firebase estabelecida com sucesso!")

db = firestore.client()
produtos_ref = db.collection('produtos')
vendas_ref = db.collection('vendas')

# --- DECORADORES DE SEGURANÇA ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        id_token = request.headers.get('Authorization')
        if not id_token or 'Bearer ' not in id_token:
            return jsonify({'message': 'Token de autenticação ausente ou mal formatado.'}), 401
        
        try:
            id_token = id_token.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            
            user_doc = firestore.client().collection('users').document(decoded_token['uid']).get()
            if not user_doc.exists:
                return jsonify({'message': 'Usuário não encontrado no Firestore.'}), 404
            
            g.user = decoded_token
            g.user['role'] = user_doc.to_dict().get('role')
            
        except Exception as e:
            print(f"Erro na autenticação: {e}")
            return jsonify({'message': 'Token de autenticação inválido ou expirado.'}), 403
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.user.get('role') != 'admin':
            return jsonify({'message': 'Acesso negado: Requer privilégios de administrador.'}), 403
        return f(*args, **kwargs)
    return decorated

# --- ROTAS DA API ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/api/produtos', methods=['GET'])
@token_required
def listar_produtos():
    try:
        produtos = []
        for doc in produtos_ref.stream():
            produto = doc.to_dict()
            produto['id'] = doc.id
            produtos.append(produto)
        return jsonify(produtos), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 500

@app.route('/api/produtos', methods=['POST'])
@token_required
@admin_required
def criar_produto():
    try:
        dados_produto = request.get_json()
        update_time, doc_ref = produtos_ref.add(dados_produto)
        print(f"✅ Produto adicionado com ID: {doc_ref.id}")
        return jsonify({"status": "sucesso", "id": doc_ref.id}), 201
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/produtos/<string:product_id>', methods=['PUT'])
@token_required
@admin_required
def atualizar_produto(product_id):
    try:
        dados_atualizacao = request.get_json()
        produtos_ref.document(product_id).update(dados_atualizacao)
        print(f"🔄 Produto atualizado com ID: {product_id}")
        return jsonify({"status": "sucesso", "id": product_id}), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/produtos/<string:product_id>', methods=['DELETE'])
@token_required
@admin_required
def deletar_produto(product_id):
    try:
        produtos_ref.document(product_id).delete()
        print(f"🗑️ Produto deletado com ID: {product_id}")
        return jsonify({"status": "sucesso", "id": product_id}), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 400

# --- ROTAS DE VENDAS ---

@app.route('/api/vendas', methods=['POST'])
@token_required
def registrar_venda():
    """Registra uma nova venda, atualizando o estoque de forma atômica."""
    try:
        dados_venda = request.get_json()
        pagamento = dados_venda.get('pagamento', {})

        # --- NOVA VALIDAÇÃO DE PAGAMENTO AQUI ---
        if not pagamento.get('metodo'):
            return jsonify({'message': 'Forma de pagamento não informada.'}), 400

        if pagamento.get('metodo') == 'Crédito':
            tipo_credito = pagamento.get('tipoCredito')
            if tipo_credito not in ['avista', 'parcelado']:
                return jsonify({'message': 'Tipo de crédito inválido.'}), 400
            
            if tipo_credito == 'parcelado' and (not pagamento.get('parcelas') or pagamento['parcelas'] < 2):
                 return jsonify({'message': 'Parcelas inválidas para pagamento parcelado.'}), 400
        # --- FIM DA NOVA VALIDAÇÃO ---


        @firestore.transactional
        def processar_venda(transaction):
            itens_vendidos = dados_venda.get('itens', [])
            if not itens_vendidos:
                raise Exception("A lista de itens vendidos não pode estar vazia.")
            
            valor_total_venda = 0
            itens_com_detalhes = []
            produtos_para_atualizar = []

            for item in itens_vendidos:
                produto_id = item.get('produtoId')
                quantidade_vendida = item.get('quantidade')

                produto_ref = produtos_ref.document(produto_id)
                produto_snapshot = produto_ref.get(transaction=transaction)

                if not produto_snapshot.exists:
                    raise Exception(f"Produto com ID {produto_id} não encontrado.")

                produto_data = produto_snapshot.to_dict()
                estoque_atual = (
                    produto_data.get('quantidadeEstoque')
                    if 'quantidadeEstoque' in produto_data
                    else produto_data.get('estoque', 0)
                )

                if estoque_atual < quantidade_vendida:
                    raise Exception(f"Estoque insuficiente para '{produto_data.get('nome')}'.")

                produtos_para_atualizar.append({
                    "ref": produto_ref,
                    "novo_estoque": estoque_atual - quantidade_vendida
                })

                preco_unitario = (
                    produto_data.get('precoVenda')
                    if 'precoVenda' in produto_data
                    else produto_data.get('preco', 0)
                )

                valor_item = preco_unitario * quantidade_vendida
                valor_total_venda += valor_item

                itens_com_detalhes.append({
                    'produtoId': produto_id,
                    'nomeProduto': produto_data.get('nome'),
                    'quantidade': quantidade_vendida,
                    'precoUnitarioVenda': preco_unitario
                })

            for prod in produtos_para_atualizar:
                transaction.update(prod["ref"], {'quantidadeEstoque': prod["novo_estoque"]})

            registro_venda = {
                'dataVenda': firestore.SERVER_TIMESTAMP,
                'vendedorId': g.user['uid'],
                'vendedorNome': g.user.get('name', g.user.get('email')),
                'pagamento': pagamento,
                'itens': itens_com_detalhes,
                'valorTotal': valor_total_venda
            }
            nova_venda_ref = vendas_ref.document()
            transaction.set(nova_venda_ref, registro_venda)
            
            return nova_venda_ref.id

        transaction = db.transaction()
        venda_id = processar_venda(transaction)
        
        print(f"💰 Venda registrada com sucesso! ID: {venda_id}")
        return jsonify({"status": "sucesso", "vendaId": venda_id}), 201
    except Exception as e:
        print(f"❌ Erro ao registrar venda: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 400

@app.route('/api/vendas', methods=['GET'])
@token_required
def listar_vendas():
    try:
        todas_vendas = []
        vendas_stream = vendas_ref.order_by(
            'dataVenda', direction=firestore.Query.DESCENDING
        ).stream()
        for venda in vendas_stream:
            venda_data = venda.to_dict()
            venda_data['id'] = venda.id
            if 'dataVenda' in venda_data and venda_data['dataVenda']:
                 venda_data['dataVenda'] = venda_data['dataVenda'].isoformat()
            todas_vendas.append(venda_data)
        return jsonify(todas_vendas), 200
    except Exception as e:
        return jsonify({"status": "erro", "message": str(e)}), 500

@app.route('/api/dashboard-data', methods=['GET'])
@token_required
@admin_required
def get_dashboard_data():
    try:
        produtos_map = {p.id: p.to_dict() for p in produtos_ref.stream()}
        vendas = list(vendas_ref.stream())

        faturamento_bruto = 0
        custo_total = 0
        total_itens_vendidos = 0
        vendas_por_dia = {}

        for venda in vendas:
            venda_data = venda.to_dict()
            faturamento_bruto += venda_data.get('valorTotal', 0)
            
            for item in venda_data.get('itens', []):
                produto_id = item.get('produtoId')
                quantidade = item.get('quantidade')
                total_itens_vendidos += quantidade
                
                if produto_id in produtos_map and produtos_map[produto_id].get('precoCusto'):
                    custo_total += produtos_map[produto_id]['precoCusto'] * quantidade

            data_venda = venda_data.get('dataVenda')
            if data_venda and isinstance(data_venda, datetime):
                dia = data_venda.strftime('%Y-%m-%d')
                if dia not in vendas_por_dia:
                    vendas_por_dia[dia] = 0
                vendas_por_dia[dia] += venda_data.get('valorTotal', 0)

        lucro_liquido = faturamento_bruto - custo_total
        
        vendas_por_dia_lista = sorted(
            [{"data": dia, "total": total} for dia, total in vendas_por_dia.items()],
            key=lambda x: x['data']
        )

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
        return jsonify({"status": "erro", "message": str(e)}), 500
    
# Adicione esta nova rota (Criação de usuário) ao main.py

@app.route('/api/users/create', methods=['POST'])
@token_required
@admin_required
def create_user():
    """Cria um novo usuário no Firebase Auth e no Firestore (apenas para admins)."""
    try:
        data = request.get_json()
        email = data['email']
        password = data['password']
        nome = data['nome']
        role = data['role']

        if role not in ['admin', 'vendedor']:
            return jsonify({'message': 'O papel (role) deve ser "admin" ou "vendedor".'}), 400

        # 1. Cria o usuário no Firebase Authentication
        new_user = auth.create_user(
            email=email,
            password=password,
            display_name=nome
        )

        # 2. Salva as informações adicionais (como o role) no Firestore
        user_data = {
            'email': email,
            'nome': nome,
            'role': role
        }
        db.collection('users').document(new_user.uid).set(user_data)
        
        print(f"✅ Usuário '{nome}' criado com sucesso com UID: {new_user.uid}")
        return jsonify({'status': 'sucesso', 'uid': new_user.uid}), 201

    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        # Retorna uma mensagem mais amigável se o e-mail já existir
        if 'EMAIL_EXISTS' in str(e):
             return jsonify({'status': 'erro', 'message': 'Este e-mail já está cadastrado.'}), 409
        return jsonify({'status': 'erro', 'message': str(e)}), 500

# --- PONTO DE ENTRADA ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)