# 📦 Настройка GitHub репозитория

## 1. Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) и войдите
2. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
3. Заполните:
   - **Repository name:** `task-management-bot` (или любое другое)
   - **Description:** `Telegram bot for task management`
   - **Visibility:** Public или Private (на ваше усмотрение)
   - **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (у нас уже всё есть)
4. Нажмите **"Create repository"**

## 2. Подключите локальный репозиторий к GitHub

Выполните эти команды в терминале (замените `ваш-username` на ваш GitHub username):

```bash
cd "C:\Users\Sergey\TASK MANAGEMENT BOT"

# Добавьте remote репозиторий
git remote add origin https://github.com/ваш-username/task-management-bot.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

Если GitHub попросит авторизацию:
- Используйте Personal Access Token вместо пароля
- Или настройте SSH ключи

## 3. Проверьте

Зайдите на `https://github.com/ваш-username/task-management-bot` - там должен быть весь код!

## 4. Дальше

Теперь можно деплоить на Railway! Смотрите [QUICK_START.md](./QUICK_START.md)


