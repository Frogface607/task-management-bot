# Task Management Bot

Простой бот для управления задачами в Telegram. Создан для бухгалтерии и офисной работы. Построен на Node.js, Telegraf, Supabase и node-cron.

## Tech Stack
- Node.js 18+
- Telegraf 4.x
- Supabase (PostgreSQL) via `@supabase/supabase-js`
- node-cron
- Pino logger

## Project Structure

```
task-management-bot/
├── src/
│   ├── bot/
│   │   ├── index.js
│   │   ├── commands/
│   │   ├── handlers/
│   │   └── keyboards/
│   ├── database/
│   │   ├── supabase.js
│   │   └── queries/
│   ├── services/
│   └── config/
│       └── constants.js
├── migrations.sql
├── .env.example
├── package.json
└── README.md
```

## Environment Variables
Скопируйте `.env.example` в `.env` и заполните значения:

```
TELEGRAM_BOT_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
ADMIN_TELEGRAM_ID=
TIMEZONE=Europe/Moscow
```

## Setup
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте `.env` из `.env.example` и заполните значения.
3. Создайте схему базы данных (выполните в SQL редакторе Supabase):
   ```sql
   -- Скопируйте содержимое migrations.sql и выполните
   ```
4. Запустите бота:
   ```bash
   npm run dev
   ```

## Основные функции
- Создание и назначение задач подчиненным
- Установка дедлайнов
- Уведомления о дедлайнах
- Отслеживание статуса задач
- Управление рабочими пространствами
