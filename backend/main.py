import os
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request

app = Flask(__name__)

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
print("🔥 Conexão com Firebase estabelecida com sucesso!")

db = firestore.client()
produtos_ref = db.collection('produtos')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend da Lume Cume está no ar!"}), 200

@app.route('/api/produtos', methods=['POST'])
def criar_produto():
    """Cria um novo produto no banco de dados com mais depuração."""
    print("\n--- Recebida nova requisição em /api/produtos [POST] ---")
    try:
        # --- INÍCIO DA DEPURAÇÃO ---
        # 1. Vamos verificar o cabeçalho Content-Type
        print(f"Cabeçalho Content-Type: {request.headers.get('Content-Type')}")

        # 2. Vamos ver os dados brutos que chegaram, antes de qualquer coisa
        raw_data = request.data
        print(f"Dados Brutos (raw) recebidos: {raw_data}")
        # --- FIM DA DEPURAÇÃO ---

        # Tenta fazer o parse do JSON. get_json() é mais robusto.
        dados_produto = request.get_json()
        print(f"Dados após o parse do JSON: {dados_produto}")
        
        # Adiciona o produto ao Firestore
        update_time, doc_ref = produtos_ref.add(dados_produto)
        
        print(f"✅ Produto adicionado com ID: {doc_ref.id}")
        return jsonify({"status": "sucesso", "id": doc_ref.id}), 201

    except Exception as e:
        # --- DEPURAÇÃO DO ERRO ---
        print(f"!!!!!!!!!! ❌ OCORREU UM ERRO AO PROCESSAR A REQUISIÇÃO ❌ !!!!!!!!!!")
        print(f"Tipo do Erro: {type(e)}")
        print(f"Mensagem do Erro: {e}")
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        # --- FIM DA DEPURAÇÃO DO ERRO ---
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)