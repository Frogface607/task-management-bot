import { Markup } from 'telegraf';

export function taskTemplatesListKeyboard(templates) {
  const buttons = templates.map(t => [
    Markup.button.callback(`📋 ${t.name}`, `template:use:${t.id}`)
  ]);
  
  buttons.push([
    Markup.button.callback('➕ Создать шаблон', 'template:create'),
    Markup.button.callback('🗑 Удалить шаблон', 'template:delete')
  ]);
  
  buttons.push([
    Markup.button.callback('« Назад', 'admin:menu')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

export function taskTemplateDeleteKeyboard(templates) {
  const buttons = templates.map(t => [
    Markup.button.callback(`🗑 ${t.name}`, `template:delete_confirm:${t.id}`)
  ]);
  
  buttons.push([
    Markup.button.callback('« Назад', 'admin:templates')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

