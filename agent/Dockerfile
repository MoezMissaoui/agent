FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app
COPY run.py .

EXPOSE 8000

# Port d’écoute dans le conteneur : 8000 (mapper l’hôte dans compose).
ENV API_HOST=0.0.0.0 \
    API_PORT=8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/openapi.json', timeout=4)"

CMD ["sh", "-c", "exec uvicorn app.main:app --host \"$API_HOST\" --port \"$API_PORT\""]
