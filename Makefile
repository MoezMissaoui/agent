# Synapse IA — Docker Compose (racine du dépôt)
# Prérequis : .env et agent/.env
# Usage : make help | make up-build | make dev-build

COMPOSE := docker compose
ENV := --env-file .env --env-file agent/.env
BASE := -f docker-compose.yml
DEV := -f docker-compose.yml -f docker-compose.dev.yml

.DEFAULT_GOAL := help

.PHONY: help up up-build stop down down-volumes ps logs build dev dev-build restart

help:
	@echo "Synapse IA - Docker"
	@echo "  make up-build      Stack (detached) + build images"
	@echo "  make up            Stack sans rebuild"
	@echo "  make dev-build     Stack dev (hot reload backend + frontend + agent) + build"
	@echo "  make dev           Idem sans rebuild image"
	@echo "  make stop          docker compose stop"
	@echo "  make down          docker compose down"
	@echo "  make down-volumes  down -v (MySQL/Chroma)"
	@echo "  make ps            docker compose ps"
	@echo "  make logs          docker compose logs -f"
	@echo "  make build         docker compose build"
	@echo "  make restart       down puis up-build"

up-build:
	$(COMPOSE) $(ENV) $(BASE) up -d --build

up:
	$(COMPOSE) $(ENV) $(BASE) up -d

dev-build:
	$(COMPOSE) $(ENV) $(DEV) up -d --build

dev:
	$(COMPOSE) $(ENV) $(DEV) up -d

stop:
	$(COMPOSE) $(BASE) stop

down:
	$(COMPOSE) $(BASE) down

down-volumes:
	$(COMPOSE) $(BASE) down -v

ps:
	$(COMPOSE) $(BASE) ps

logs:
	$(COMPOSE) $(BASE) logs -f

build:
	$(COMPOSE) $(ENV) $(BASE) build

restart:
	$(COMPOSE) $(BASE) down
	$(COMPOSE) $(ENV) $(BASE) up -d --build
