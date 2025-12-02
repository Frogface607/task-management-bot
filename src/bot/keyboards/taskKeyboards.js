import { Markup } from 'telegraf';

export function simpleTaskKeyboard(taskId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Выполнено', `task:complete:${taskId}`)],
    [Markup.button.callback('⚠️ Проблема', `task:issue:${taskId}`)],
  ]);
}

export function formatSimpleTaskText(task) {
  const deadline = task.deadline ? new Date(task.deadline).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Не указан';
  return `┌─────────────────────────────┐
│ 📋 ${task.title}              │
│                             │
│ ${task.description}         │
│                             │
│ Deadline: ${deadline}     │
│                             │
│ [✅ Выполнено] [⚠️ Проблема] │
└─────────────────────────────┘`;
}

export function deadlineQuickKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Сегодня 18:00', 'deadline:today:18:00'), Markup.button.callback('Сегодня 21:00', 'deadline:today:21:00')],
    [Markup.button.callback('Завтра 12:00', 'deadline:tomorrow:12:00'), Markup.button.callback('Завтра 18:00', 'deadline:tomorrow:18:00')],
    [Markup.button.callback('Через 3 часа', 'deadline:relative:3h'), Markup.button.callback('Через день', 'deadline:relative:1d')],
    [Markup.button.callback('📅 Выбрать дату', 'deadline:custom')],
  ]);
}

export function deadlineCustomKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('« Назад к быстрому выбору', 'deadline:quick')],
  ]);
}
