# Usar uma imagem base oficial do Python
FROM python:3.11-slim

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar o arquivo de dependências
COPY requirements.txt .

# Instalar as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o resto do código da aplicação
COPY . .

# Expor a porta que o Cloud Run usará
EXPOSE 8080

# Comando para iniciar a aplicação com Gunicorn
# Ele irá procurar pela variável 'app' no arquivo 'main.py'
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app"]