import { formatDeadline } from './dateParser.js';
import { formatMobileTask, formatShortDeadline, formatMobileStats } from './mobileOptimizer.js';

export function formatTaskList(tasks, adminUsername, mobile = false) {
  if (!tasks || tasks.length === 0) {
    return mobile 
      ? `📊 **Мои задачи (0 активных)**\n\nНет активных задач`
      : `┌─────────────────────────────┐
│ 📊 Мои задачи (0 активных)    │
├─────────────────────────────┤
│ Нет активных задач         │
└─────────────────────────────┘`;
  }
  
  const activeCount = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
  const overdueCount = tasks.filter(t => isTaskOverdue(t)).length;
  
  if (mobile) {
    let result = `📊 **Мои задачи (${activeCount} активных)${overdueCount > 0 ? `, ${overdueCount} просроченных` : ''}**\n\n`;
    
    tasks.forEach((task, index) => {
      result += formatMobileTask(task);
      if (index < tasks.length - 1) result += '\n\n';
    });
    
    return result;
  }
  
  // Desktop version
  let result = `┌─────────────────────────────┐
│ 📊 Мои задачи (${activeCount} активных)${overdueCount > 0 ? `, ${overdueCount} просроченных` : ''} │
├─────────────────────────────┤`;
  
  tasks.forEach(task => {
    const statusIcon = getStatusIcon(task);
    const statusText = getStatusText(task);
    const deadlineText = formatDeadlineShort(task.deadline);
    const isOverdue = isTaskOverdue(task);
    const progressBar = getProgressBar(task);
    
    result += `\n│ ${statusIcon} ${task.title}`;
    result += `\n│ @${task.assigned_to?.username || 'unknown'}`;
    result += `\n│ Deadline: ${deadlineText}${isOverdue ? ' ⚠️' : ''}`;
    result += `\n│ Status: ${statusText}`;
    result += `\n│ ${progressBar}`;
    result += `\n│ [👁 Детали] [🔔 Напомнить]`;
    result += `\n├─────────────────────────────┤`;
  });
  
  // Remove last separator and close
  result = result.slice(0, -35) + '└─────────────────────────────┘';
  
  return result;
}

function getProgressBar(task) {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const created = new Date(task.created_at);
  
  if (!deadline) return 'Прогресс: ░░░░░░░░░░ 0%';
  
  const totalTime = deadline - created;
  const elapsedTime = now - created;
  const progress = Math.min(Math.max(elapsedTime / totalTime, 0), 1);
  
  const barLength = 10;
  const filledBars = Math.round(progress * barLength);
  const emptyBars = barLength - filledBars;
  
  const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  const percentage = Math.round(progress * 100);
  
  if (task.status === 'approved') return `Прогресс: ${'█'.repeat(barLength)} 100% ✅`;
  if (task.status === 'rejected') return `Прогресс: ${'█'.repeat(barLength)} 100% ❌`;
  if (isTaskOverdue(task)) return `Прогресс: ${bar} ${percentage}% 🔴`;
  
  return `Прогресс: ${bar} ${percentage}%`;
}

export function formatTaskDetails(task, adminUsername) {
  const createdTime = new Date(task.created_at);
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();
  
  const timeElapsed = Math.round((now - createdTime) / (1000 * 60 * 60)); // hours
  const timeElapsedText = timeElapsed < 1 ? 'Только что' : 
                         timeElapsed < 24 ? `${timeElapsed}ч назад` :
                         `${Math.round(timeElapsed / 24)}д назад`;
  
  const deadlineText = deadline ? formatDeadline(task.deadline) : 'Не указан';
  const timeToDeadline = deadline ? Math.round((deadline - now) / (1000 * 60 * 60)) : null;
  
  let timeToDeadlineText = '';
  if (timeToDeadline !== null) {
    if (timeToDeadline < 0) {
      timeToDeadlineText = ` (просрочен на ${Math.abs(timeToDeadline)}ч)`;
    } else if (timeToDeadline < 1) {
      timeToDeadlineText = ' (сейчас)';
    } else if (timeToDeadline < 24) {
      timeToDeadlineText = ` (через ${timeToDeadline}ч)`;
    } else {
      timeToDeadlineText = ` (через ${Math.round(timeToDeadline / 24)}д)`;
    }
  }
  
  return `┌─────────────────────────────┐
│ 📋 ${task.title}              │
├─────────────────────────────┤
│ Описание:                   │
│ ${task.description || 'Нет описания'}         │
├─────────────────────────────┤
│ Исполнитель: @${task.assigned_to?.username || 'unknown'}        │
│ Создал: @${task.created_by?.username || 'unknown'}              │
│ Создан: ${timeElapsedText}              │
├─────────────────────────────┤
│ Дедлайн: ${deadlineText}${timeToDeadlineText}     │
│ Статус: ${getStatusText(task)}              │
└─────────────────────────────┘`;
}

export function formatReminderMessage(task, adminUsername, mobile = false) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();
  const timeToDeadline = deadline ? Math.round((deadline - now) / (1000 * 60 * 60)) : null;
  
  let timeToDeadlineText = '';
  if (timeToDeadline !== null) {
    if (timeToDeadline < 0) {
      timeToDeadlineText = ` (просрочен на ${Math.abs(timeToDeadline)}ч)`;
    } else if (timeToDeadline < 1) {
      timeToDeadlineText = ' (сейчас)';
    } else if (timeToDeadline < 24) {
      timeToDeadlineText = ` (через ${timeToDeadline}ч)`;
    } else {
      timeToDeadlineText = ` (через ${Math.round(timeToDeadline / 24)}д)`;
    }
  }
  
  if (mobile) {
    const deadlineText = deadline ? formatShortDeadline(task.deadline) : 'Не указан';
    return `⏰ **Напоминание от @${adminUsername}**

🎯 **${task.title}**
⏰ ${deadlineText}${timeToDeadlineText}

💪 Не забудь выполнить!`;
  }
  
  const deadlineText = deadline ? formatDeadline(task.deadline) : 'Не указан';
  
  return `⏰ Напоминание от @${adminUsername}

Задача: ${task.title}
Deadline: ${deadlineText}${timeToDeadlineText}

Не забудь выполнить! 💪`;
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

function getStatusText(task) {
  const now = new Date();
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < now && ['assigned', 'in_progress'].includes(task.status);
  
  if (isOverdue) return '🔴 Просрочен';
  if (task.status === 'assigned') return '🟡 Не начат';
  if (task.status === 'in_progress') return '🟢 В процессе';
  if (task.status === 'pending_review') return '⏳ На проверке';
  if (task.status === 'approved') return '✅ Выполнен';
  if (task.status === 'rejected') return '❌ Отклонен';
  
  return '⚪ Неизвестно';
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
