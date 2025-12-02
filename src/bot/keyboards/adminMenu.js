import { Markup } from 'telegraf';

export function adminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📝 Создать задачу', 'admin:create_task')],
    [Markup.button.callback('📋 Типовые задачи', 'admin:templates')],
    [Markup.button.callback('📊 Мои задачи', 'admin:my_tasks')],
    [Markup.button.callback('🏢 Панель управления', 'workspace:management')],
    [Markup.button.callback('➕ Создать workspace', 'admin:create_workspace')],
    [Markup.button.callback('👥 Управление пользователями', 'admin:manage_users')],
    [Markup.button.callback('🚨 Проблемы', 'admin:issues')],
    [Markup.button.callback('📈 Статистика', 'admin:stats')],
    [Markup.button.callback('🧪 Тест онбординга', 'admin:test_onboarding')],
  ]);
}
