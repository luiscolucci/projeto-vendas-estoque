FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-service-account.json

CMD ["python", "main.py"]