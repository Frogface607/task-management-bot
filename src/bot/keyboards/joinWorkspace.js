import { Markup } from 'telegraf';

export function joinWorkspaceKeyboard(inviteCode) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Присоединиться', `ws:join:${inviteCode}`)],
  ]);
}


