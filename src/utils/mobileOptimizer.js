// Mobile optimization utilities
export function shortenMessage(message, maxLength = 200) {
  if (message.length <= maxLength) return message;
  
  // Try to cut at sentence end
  const sentences = message.split(/[.!?]/);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength - 3) {
      result += sentence + '.';
    } else {
      break;
    }
  }
  
  if (result.length > 0) {
    return result + '..';
  }
  
  // If no good cut point, just truncate
  return message.substring(0, maxLength - 3) + '...';
}

export function formatMobileTask(task) {
  const statusEmoji = getStatusEmoji(task.status);
  const deadline = task.deadline ? formatShortDeadline(task.deadline) : 'Без дедлайна';
  
  return `${statusEmoji} **${task.title}**
👤 @${task.assigned_to?.username || 'unknown'}
⏰ ${deadline}

[👁 Детали] [🔔 Напомнить]`;
}

export function formatShortDeadline(deadline) {
  if (!deadline) return 'Без дедлайна';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMs < 0) {
    return 'Просрочен ⚠️';
  } else if (diffHours < 1) {
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `Через ${diffMins}м`;
  } else if (diffHours < 24) {
    return `Через ${diffHours}ч`;
  } else if (diffDays < 7) {
    return `Через ${diffDays}д`;
  } else {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
}

function getStatusEmoji(status) {
  const statusMap = {
    'assigned': '🟡',
    'in_progress': '🟢',
    'pending_review': '⏳',
    'approved': '✅',
    'rejected': '❌'
  };
  return statusMap[status] || '⚪';
}

export function createMobileKeyboard(buttons, maxPerRow = 2) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += maxPerRow) {
    rows.push(buttons.slice(i, i + maxPerRow));
  }
  return rows;
}

export function formatMobileStats(stats) {
  return `📊 **Статистика**
┌─────────────┐
│ Задачи: ${stats.total}      │
│ ✅ Выполнено: ${stats.completed} │
│ 🔄 Активных: ${stats.active}   │
│ ⚠️ Просрочено: ${stats.overdue} │
└─────────────┘`;
}





