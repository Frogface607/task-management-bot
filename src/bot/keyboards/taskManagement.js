import { Markup } from 'telegraf';

export function taskListKeyboard(tasks, currentFilter = 'all', currentSort = 'deadline') {
  const buttons = [];
  
  // Task buttons
  tasks.forEach(task => {
    const statusIcon = getStatusIcon(task);
    const deadlineText = formatDeadlineShort(task.deadline);
    const isOverdue = isTaskOverdue(task);
    
    buttons.push([
      Markup.button.callback(
        `${statusIcon} ${task.title}`,
        `task:view:${task.id}`
      )
    ]);
    
    buttons.push([
      Markup.button.callback(
        `@${task.assigned_to?.username || 'unknown'} | ${deadlineText}${isOverdue ? ' ⚠️' : ''}`,
        `task:view:${task.id}`
      )
    ]);
    
    buttons.push([
      Markup.button.callback('👁 Детали', `task:details:${task.id}`),
      Markup.button.callback('🔔 Напомнить', `task:remind:${task.id}`)
    ]);
  });
  
  // Filter buttons
  const filterButtons = [
    Markup.button.callback(
      currentFilter === 'all' ? '✅ Все' : 'Все',
      'tasks:filter:all'
    ),
    Markup.button.callback(
      currentFilter === 'active' ? '✅ Активные' : 'Активные',
      'tasks:filter:active'
    ),
    Markup.button.callback(
      currentFilter === 'overdue' ? '✅ Просроченные' : 'Просроченные',
      'tasks:filter:overdue'
    ),
    Markup.button.callback(
      currentFilter === 'pending_review' ? '✅ На проверке' : 'На проверке',
      'tasks:filter:pending_review'
    )
  ];
  
  buttons.push(filterButtons);
  
  // Sort buttons
  const sortButtons = [
    Markup.button.callback(
      currentSort === 'deadline' ? '📅 По дедлайну' : 'По дедлайну',
      'tasks:sort:deadline'
    ),
    Markup.button.callback(
      currentSort === 'status' ? '📊 По статусу' : 'По статусу',
      'tasks:sort:status'
    ),
    Markup.button.callback(
      currentSort === 'assignee' ? '👤 По исполнителю' : 'По исполнителю',
      'tasks:sort:assignee'
    )
  ];
  
  buttons.push(sortButtons);
  
  // Action buttons
  buttons.push([
    Markup.button.callback('📝 Создать задачу', 'admin:create_task'),
    Markup.button.callback('📁 Архив', 'tasks:archive')
  ]);
  
  return Markup.inlineKeyboard(buttons);
}

export function taskDetailsKeyboard(taskId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔔 Напомнить', `task:remind:${taskId}`)],
    [Markup.button.callback('« Назад к списку', 'tasks:list')]
  ]);
}

function getStatusIcon(task) {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < now && ['assigned', 'in_progress'].includes(task.status);
  
  if (isOverdue) return '🔴';
  if (task.status === 'in_progress') return '🟢';
  if (task.status === 'assigned') return '🟡';
  if (task.status === 'pending_review') return '⏳';
  if (task.status === 'approved') return '✅';
  if (task.status === 'rejected') return '❌';
  
  return '⚪';
}

function formatDeadlineShort(deadline) {
  if (!deadline) return 'Без дедлайна';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 0) return 'Просрочен';
  if (diffHours < 1) return 'Сейчас';
  if (diffHours < 24) return `Через ${diffHours}ч`;
  
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'Завтра';
  if (diffDays < 7) return `Через ${diffDays}д`;
  
  return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
}

function isTaskOverdue(task) {
  if (!task.deadline) return false;
  const now = new Date();
  const deadline = new Date(task.deadline);
  return deadline < now && ['assigned', 'in_progress'].includes(task.status);
}
