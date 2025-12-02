import { Markup } from 'telegraf';

export function submitForReviewKeyboard(taskId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📤 Отправить на проверку', `task:submit:${taskId}`)],
  ]);
}

export function reviewActionsKeyboard(taskId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Одобрить', `task:approve:${taskId}`),
      Markup.button.callback('❌ Отклонить', `task:reject:${taskId}`),
    ],
  ]);
}
