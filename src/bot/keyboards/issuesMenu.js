import { Markup } from 'telegraf';

export function issueCategoriesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Оборудование', 'issue:cat:Оборудование')],
    [Markup.button.callback('Уборка', 'issue:cat:Уборка')],
    [Markup.button.callback('Инвентарь', 'issue:cat:Инвентарь')],
    [Markup.button.callback('Другое', 'issue:cat:Другое')],
  ]);
}

export function issueActionsKeyboard(issueId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('В работу', `issue:status:${issueId}:in_progress`),
      Markup.button.callback('Решено', `issue:status:${issueId}:resolved`),
    ],
  ]);
}


