.PHONY: up down build watch logs ps restart clean

## Start all containers (no rebuild)
up:
	docker compose up -d

## Stop all containers and remove volumes
down:
	docker compose down -v

## Rebuild images and start (use after any code change if not using watch)
build:
	docker compose up --build -d

## Auto-rebuild services when source files change (requires Docker Desktop 4.24+)
## Watches: services/*/src  and  packages/
watch:
	docker compose watch

## Tail logs for all services (Ctrl+C to stop)
logs:
	docker compose logs -f

## Show running container status
ps:
	docker compose ps

## Restart a specific service without rebuilding, e.g.: make restart s=todo-service
restart:
	docker compose restart $(s)

## Rebuild and restart only the todo-service
rebuild-todo:
	docker compose up --build -d todo-service

## Rebuild and restart only the auth-service
rebuild-auth:
	docker compose up --build -d auth-service

## Remove all containers, volumes, and cached images for a clean slate
clean:
	docker compose down -v --rmi local
