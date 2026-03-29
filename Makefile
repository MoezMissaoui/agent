VENV := .venv

ifeq ($(OS),Windows_NT)
	PY := $(VENV)/Scripts/python.exe
	PIP := $(VENV)/Scripts/pip.exe
else
	PY := $(VENV)/bin/python
	PIP := $(VENV)/bin/pip
endif

.PHONY: run install venv docker-prod docker-dev

# Start the API (reads API_HOST / API_PORT and secrets from .env via run.py)
run:
	$(PY) run.py

# Docker : image figée, rebuild nécessaire si le code change sans volume dev
docker-prod:
	docker compose up -d --build

# Docker : code monté + uvicorn --reload (voir docker-compose.dev.yml)
docker-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

venv:
	python -m venv $(VENV)

install: venv
	$(PIP) install -r requirements.txt
