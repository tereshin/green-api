# Тестовый веб-интерфейс GREEN-API Telegram

React 19 + TypeScript + Vite, менеджер пакетов — pnpm.

## Запуск

```bash
cp .env.example .env.local   # заполнить переменные
pnpm install
pnpm dev                     # dev-сервер
pnpm build                   # tsc -b && vite build
pnpm lint                    # oxlint
pnpm test                    # vitest
```

## Деплой

Пуш в `main` запускает [`.github/workflows/ci.yml`](.github/workflows/ci.yml): lint и сборка, затем выкладка на сервер по SSH. Pull request только проверяется.
