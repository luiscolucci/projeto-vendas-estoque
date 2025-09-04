FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-service-account.json

#CMD ["python", "main.py"]

# Expõe a porta que o Gunicorn irá usar
EXPOSE 8080

# Inicia a aplicação com Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app"]