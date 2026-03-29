VENV := .venv

ifeq ($(OS),Windows_NT)
	PY := $(VENV)/Scripts/python.exe
	PIP := $(VENV)/Scripts/pip.exe
else
	PY := $(VENV)/bin/python
	PIP := $(VENV)/bin/pip
endif

.PHONY: run install venv

# Start the API (reads API_HOST / API_PORT and secrets from .env via run.py)
run:
	$(PY) run.py

venv:
	python -m venv $(VENV)

install: venv
	$(PIP) install -r requirements.txt
