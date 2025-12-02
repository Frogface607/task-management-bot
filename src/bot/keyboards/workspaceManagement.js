import { Markup } from 'telegraf';

export function workspaceManagementKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Информация о воркспейсе', 'workspace:info')],
    [Markup.button.callback('🔗 Ссылка для приглашения', 'workspace:invite')],
    [Markup.button.callback('👥 Управление пользователями', 'workspace:users')],
    [Markup.button.callback('🎭 Роли и права', 'workspace:roles')],
    [Markup.button.callback('📈 Статистика', 'workspace:stats')],
    [Markup.button.callback('⚙️ Настройки', 'workspace:settings')],
    [Markup.button.callback('🏠 Главное меню', 'main_menu')]
  ]);
}

export function userManagementKeyboard(users, currentPage = 0, pageSize = 5) {
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const pageUsers = users.slice(startIndex, endIndex);
  
  const buttons = pageUsers.map(user => [
    Markup.button.callback(
      `👤 ${user.username} (${user.total_xp || 0} XP)`, 
      `user:manage:${user.id}`
    )
  ]);
  
  // Pagination buttons
  const paginationButtons = [];
  if (currentPage > 0) {
    paginationButtons.push(Markup.button.callback('⬅️ Назад', `users:page:${currentPage - 1}`));
  }
  if (endIndex < users.length) {
    paginationButtons.push(Markup.button.callback('Вперед ➡️', `users:page:${currentPage + 1}`));
  }
  
  if (paginationButtons.length > 0) {
    buttons.push(paginationButtons);
  }
  
  buttons.push([
    Markup.button.callback('🔄 Обновить', 'workspace:users'),
    Markup.button.callback('🏠 Назад', 'workspace:management')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

export function roleManagementKeyboard(roles) {
  const buttons = roles.map(role => [
    Markup.button.callback(
      `🎭 ${role.name} (${role.access_level})`, 
      `role:manage:${role.id}`
    )
  ]);
  
  buttons.push([
    Markup.button.callback('➕ Создать роль', 'role:create'),
    Markup.button.callback('🏠 Назад', 'workspace:management')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

export function userDetailKeyboard(userId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎭 Изменить роль', `user:role:${userId}`)],
    [Markup.button.callback('📊 Статистика пользователя', `user:stats:${userId}`)],
    [Markup.button.callback('❌ Удалить из воркспейса', `user:remove:${userId}`)],
    [Markup.button.callback('🏠 Назад к пользователям', 'workspace:users')]
  ]);
}

export function roleDetailKeyboard(roleId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Редактировать', `role:edit:${roleId}`)],
    [Markup.button.callback('👥 Назначить пользователям', `role:assign:${roleId}`)],
    [Markup.button.callback('❌ Удалить роль', `role:delete:${roleId}`)],
    [Markup.button.callback('🏠 Назад к ролям', 'workspace:roles')]
  ]);
}

export function roleSelectionKeyboard(roles, userId) {
  const buttons = roles.map(role => [
    Markup.button.callback(
      `🎭 ${role.name} (${role.access_level})`, 
      `role:assign:${roleId}:${userId}`
    )
  ]);
  
  buttons.push([
    Markup.button.callback('❌ Убрать роль', `role:remove:${userId}`),
    Markup.button.callback('🏠 Назад', `user:manage:${userId}`)
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

export function workspaceSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Обновить код приглашения', 'workspace:regenerate_invite')],
    [Markup.button.callback('⏰ Изменить часовой пояс', 'workspace:timezone')],
    [Markup.button.callback('📝 Переименовать воркспейс', 'workspace:rename')],
    [Markup.button.callback('🗑️ Удалить воркспейс', 'workspace:delete')],
    [Markup.button.callback('🏠 Назад', 'workspace:management')]
  ]);
}





