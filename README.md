# Тестовый веб-интерфейс GREEN-API Telegram

React 19 + TypeScript + Vite, менеджер пакетов — pnpm.

## Запуск

```bash
cp .env.example .env.local   # заполнить переменные
npm install                 # устанавливаем зависимости
npm dev                     # запускаем как dev-сервер
npm build                   # tsc -b && vite build
npm lint                    # oxlint
npm test                    # vitest
```

## Деплой

Пуш в `main` запускает [`.github/workflows/ci.yml`](.github/workflows/ci.yml): lint и сборка, затем выкладка на сервер по SSH. Pull request только проверяется.
