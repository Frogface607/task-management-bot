import 'dotenv/config';
import { Telegraf, Markup, session } from 'telegraf';
import pino from 'pino';
import cron from 'node-cron';
import { LOGGER_OPTIONS } from '../config/constants.js';
import { mainMenu, adminMainMenu } from './keyboards/mainMenu.js';
import { adminMenu } from './keyboards/adminMenu.js';
import { joinWorkspaceKeyboard } from './keyboards/joinWorkspace.js';
import { createWorkspace, getByInviteCode } from '../database/queries/workspace.js';
import { upsertUserByTelegram, setUserWorkspace, listUsersByWorkspace } from '../database/queries/users.js';
import { listRoles, assignUserRole } from '../database/queries/roles.js';
import { getClient } from '../database/supabase.js';
import { getSimpleTask, markTaskPendingReview, markTaskRejected, markTaskApproved, getAllTasksForAdmin, getTaskDetails } from '../database/queries/tasks.js';
import { simpleTaskKeyboard, deadlineQuickKeyboard, deadlineCustomKeyboard } from './keyboards/taskKeyboards.js';
import { createPersonalTask } from '../database/queries/personal.js';
import { submitForReviewKeyboard, reviewActionsKeyboard } from './keyboards/taskReview.js';
import { createIssue, listIssues, setIssueStatus } from '../database/queries/issues.js';
import { issueCategoriesKeyboard, issueActionsKeyboard } from './keyboards/issuesMenu.js';
import { parseNaturalDate, formatDeadline, isDateInPast, getQuickDeadlineOptions } from '../utils/dateParser.js';
import { taskListKeyboard, taskDetailsKeyboard } from './keyboards/taskManagement.js';
import { formatTaskList, formatTaskDetails, formatReminderMessage } from '../utils/taskFormatter.js';
import { formatMobileStats } from '../utils/mobileOptimizer.js';
import { getOnboardingStep, getHelpMessage, formatOnboardingMessage } from '../utils/onboarding.js';
import { 
  getWorkspaceInfo, 
  getWorkspaceStats, 
  generateInviteLink, 
  getWorkspaceRoles, 
  getWorkspaceUsers,
  updateUserRole,
  createRole,
  deleteRole,
  formatWorkspaceInfo,
  formatInviteInfo
} from '../utils/workspaceManager.js';
import { 
  workspaceManagementKeyboard, 
  userManagementKeyboard, 
  roleManagementKeyboard,
  userDetailKeyboard,
  roleDetailKeyboard,
  roleSelectionKeyboard,
  workspaceSettingsKeyboard
} from './keyboards/workspaceManagement.js';
import { taskTemplatesListKeyboard, taskTemplateDeleteKeyboard } from './keyboards/taskTemplates.js';
import { createTaskTemplate, getTaskTemplates, deleteTaskTemplate, getTaskTemplate } from '../database/queries/taskTemplates.js';

const logger = pino(LOGGER_OPTIONS);

const { TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_ID } = process.env;

// Admin check helper
function isAdmin(ctx) {
  if (!ADMIN_TELEGRAM_ID) return false;
  const adminId = String(ADMIN_TELEGRAM_ID).trim();
  const userId = String(ctx.from.id);
  const username = String(ctx.from.username || '').toLowerCase();
  const adminUsername = adminId.toLowerCase();
  
  // Check by ID (preferred) or username
  return userId === adminId || username === adminUsername;
}

// Mobile detection helper
function isMobileUser(ctx) {
  // Check if user agent contains mobile indicators
  const userAgent = ctx.from?.username || '';
  const mobileIndicators = ['mobile', 'android', 'iphone', 'ipad'];
  return mobileIndicators.some(indicator => 
    userAgent.toLowerCase().includes(indicator)
  );
}
if (!TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Global error handler for Telegraf
bot.catch((err, ctx) => {
  logger.error({ err, update: ctx.update }, 'Unhandled bot error');
});
const supabase = getClient();
bot.use(session());

// In-memory conversation state tracking
const userStates = new Map();

// Helper: resolve admin chat id (supports username or numeric id)
async function getAdminChatId() {
  const adminEnv = process.env.ADMIN_TELEGRAM_ID;
  if (!adminEnv) return null;
  if (/^\d+$/.test(adminEnv)) return adminEnv; // numeric id provided
  // Try to resolve by username stored in users table
  try {
    const { data } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('username', adminEnv.replace(/^@/, ''))
      .maybeSingle();
    return data?.telegram_id || null;
  } catch {
    return null;
  }
}

// Basic /start command registration and workspace association
bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'Unknown';

    // Upsert user by telegram_id
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const isNewUser = !existingUser;
    
    if (isNewUser) {
      const { error: insertError } = await supabase.from('users').insert({ telegram_id: telegramId, username });
      if (insertError) throw insertError;
    }

    // Support invite code via /start invite_CODE
    const payload = ctx.startPayload; // telegraf parses /start <payload>
    if (payload && payload.startsWith('invite_')) {
      const code = payload.replace('invite_', '').trim().toUpperCase();
      const ws = await getByInviteCode(code);
      if (!ws) {
        return ctx.reply('Ссылка-приглашение недействительна или истекла.');
      }
      await ctx.reply(`Рабочее пространство: ${ws.name}\nЧасовой пояс: ${ws.timezone}`, joinWorkspaceKeyboard(code));
      return;
    }

    // Check if user is admin/manager to show extended menu
    let isAdminUser = isAdmin(ctx);
    if (!isAdminUser && existingUser?.id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('roles(name, access_level)')
        .eq('user_id', existingUser.id)
        .maybeSingle();
      if (roleData?.roles?.access_level >= 60) isAdminUser = true; // Manager or higher
    }
    
    // Show onboarding for new users (or admin testing)
    if (isNewUser || (isAdminUser && ctx.message?.text?.includes('onboarding'))) {
      const userData = {
        username: username,
        telegramId: telegramId,
        workspace: existingUser?.workspace_id ? 'Подключено' : 'Не выбрано'
      };
      
      const onboardingStep = getOnboardingStep(1);
      const message = formatOnboardingMessage(onboardingStep.message, userData);
      
      // Store onboarding state
      userStates.set(telegramId, {
        action: 'onboarding',
        step: 1,
        data: userData
      });
      
      logger.info({ user: telegramId, username, isNewUser, isAdmin }, 'Onboarding started');
      await ctx.reply(message, onboardingStep.keyboard);
      return;
    }
    
    const welcomeText = `Добро пожаловать в систему управления задачами!\n\nИспользуйте меню для управления задачами и другими функциями.`;
    logger.info({ user: telegramId, username, isAdmin }, 'Handled /start');
    await ctx.reply(welcomeText, isAdmin ? adminMainMenu() : mainMenu());
  } catch (error) {
    logger.error({ error }, '/start failed');
    await ctx.reply('Что-то пошло не так. Попробуйте позже.');
  }
});

// Help command
bot.command('help', async (ctx) => {
  try {
    const helpMessage = getHelpMessage();
    await ctx.reply(helpMessage);
  } catch (e) {
    logger.error({ e }, 'help command failed');
    await ctx.reply('Не удалось загрузить справку.');
  }
});

// Test onboarding command (for admin)
bot.command('test_onboarding', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'Unknown';
    
    const userData = {
      username: username,
      telegramId: telegramId,
      workspace: 'Тестовое пространство'
    };
    
    const onboardingStep = getOnboardingStep(1);
    const message = formatOnboardingMessage(onboardingStep.message, userData);
    
    // Store onboarding state
    const onboardingState = {
      action: 'onboarding',
      step: 1,
      data: userData
    };
    userStates.set(telegramId, onboardingState);
    
    console.log('[test_onboarding] Stored state for user:', telegramId, 'State:', onboardingState);
    console.log('[test_onboarding] All states:', Array.from(userStates.entries()));
    
    await ctx.reply('🧪 Тестирование онбординга:', onboardingStep.keyboard);
  } catch (e) {
    logger.error({ e }, 'test_onboarding command failed');
    await ctx.reply('Не удалось запустить тест онбординга.');
  }
});

// Health check command
bot.command('profile', async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    console.log('[profile] telegramId =', telegramId);

    console.log('[profile] querying users by telegram_id');
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, username, workspace_id')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    if (userErr) { console.error('[profile] user query error:', userErr); throw userErr; }
    if (!user) {
      console.warn('[profile] user not found; creating stub record');
      const { error: insErr } = await supabase.from('users').insert({ telegram_id: telegramId, username: ctx.from.username || ctx.from.first_name || 'Unknown' });
      if (insErr) { console.error('[profile] insert user error:', insErr); throw insErr; }
      return ctx.reply('Профиль инициализирован. Запустите /profile еще раз.');
    }

    console.log('[profile] fetching workspace');
    let workspaceName = '—';
    if (user.workspace_id) {
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', user.workspace_id)
        .maybeSingle();
      if (wsErr) { console.error('[profile] workspace query error:', wsErr); }
      workspaceName = ws?.name || '—';
    }

    console.log('[profile] fetching role for user');
    let roleName = '—';
    const { data: rolesJoin, error: roleErr } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (roleErr) { console.error('[profile] role query error:', roleErr); }
    roleName = rolesJoin?.roles?.name || '—';

    console.log('[profile] sending response');
    const msg = `👤 ${user.username || 'Неизвестно'}\nРоль: ${roleName}\nРабочее пространство: ${workspaceName}`;
    await ctx.reply(msg);
  } catch (error) {
    console.error('[profile] ERROR:', error);
    logger.error({ error }, '/profile failed');
    await ctx.reply('Не удалось загрузить профиль.');
  }
});

// Admin: /add_checklist
bot.command('add_checklist', async (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.session = ctx.session || {};
  ctx.session.expecting = 'checklist_name';
  await ctx.reply('Название чек-листа?');
});

bot.on('text', async (ctx, next) => {
  if (!ctx.session || !ctx.session.expecting) return next();
  const expecting = ctx.session.expecting;
  // Skip workspace check when creating a new workspace
  if (expecting === 'workspace_name') {
    return next();
  }
  const text = ctx.message.text;
  // Fetch current user with workspace
  const { data: me } = await supabase
    .from('users')
    .select('id, workspace_id')
    .eq('telegram_id', String(ctx.from.id))
    .maybeSingle();
  if (!me?.workspace_id) {
    ctx.session.expecting = null;
    return ctx.reply('Join a workspace first.');
  }

  if (expecting === 'checklist_name') {
    ctx.session.checklist = { name: text.trim() };
    ctx.session.expecting = 'checklist_type';
    return ctx.reply('Тип чек-листа? (opening/closing/daily)');
  }
  if (expecting === 'checklist_type') {
    const type = text.trim().toLowerCase();
    if (!['opening', 'closing', 'daily'].includes(type)) return ctx.reply('Тип должен быть opening, closing или daily.');
    ctx.session.checklist.type = type;
    ctx.session.expecting = 'checklist_items';
    return ctx.reply('Вставьте задачи, по одной на строку. Используйте слова "photo"/"сфотографировать" для задач с фото.');
  }
  if (expecting === 'checklist_items') {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const items = lines.map((line) => {
      const lc = line.toLowerCase();
      const requiresPhoto = lc.includes('photo') || lc.includes('сфот');
      let xp = 10;
      if (/complex|cash|касс/.test(lc)) xp = 50; else if (/table|table|arrange|сервир|стол/.test(lc)) xp = 25;
      if (requiresPhoto) xp += 25;
      return { title: line, xpReward: xp, requiresPhoto };
    });
    const { createChecklistTemplate } = await import('../database/queries/checklists.js');
    await createChecklistTemplate(me.workspace_id, ctx.session.checklist.name, ctx.session.checklist.type, items);
    ctx.session.expecting = null;
    ctx.session.checklist = null;
    return ctx.reply('Checklist saved.');
  }
});

// Profile button - вызывает /profile
bot.hears('👤 Профиль', async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    console.log('[profile] telegramId =', telegramId);

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, username, total_xp, workspace_id')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    if (userErr) { console.error('[profile] user query error:', userErr); throw userErr; }
    if (!user) return ctx.reply('Профиль инициализирован. Запустите /profile еще раз.');

    let workspaceName = '—';
    if (user.workspace_id) {
      const { data: ws } = await supabase.from('workspaces').select('name').eq('id', user.workspace_id).maybeSingle();
      workspaceName = ws?.name || '—';
    }

    let roleName = '—';
    const { data: rolesJoin } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).limit(1).maybeSingle();
    roleName = rolesJoin?.roles?.name || '—';

    const msg = `👤 ${user.username || 'Неизвестно'}\nРоль: ${roleName}\nРабочее пространство: ${workspaceName}`;
    await ctx.reply(msg);
  } catch (error) {
    logger.error({ error }, '/profile failed');
    await ctx.reply('Не удалось загрузить профиль.');
  }
});


// Admin button: Создать задачу
bot.hears('📝 Создать задачу', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const userId = ctx.from.id;
  userStates.set(userId, {
    action: 'creating_task',
    step: 'title',
    data: {}
  });
  
  console.log('[create_task] Started task creation for user', userId);
  await ctx.reply('Название задачи?', Markup.forceReply());
});

// Admin button: Мои задачи
bot.hears('📊 Мои задачи', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.reply('Сначала присоединитесь к рабочему пространству.');
    }
    
    const quests = await getAllQuestsForAdmin(me.workspace_id);
    const mobile = isMobileUser(ctx);
    const formattedList = formatQuestList(quests, ctx.from.username, mobile);
    
    await ctx.reply(formattedList, questListKeyboard(quests));
  } catch (e) {
    logger.error({ e }, 'my_tasks button failed');
    await ctx.reply('Не удалось загрузить задачи.');
  }
});

// Admin button: Статистика
bot.hears('📈 Статистика', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.reply('Сначала присоединитесь к рабочему пространству.');
    }
    
    // Get statistics
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, deadline, created_at')
      .eq('workspace_id', me.workspace_id);
    
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'approved').length || 0;
    const activeTasks = tasks?.filter(t => ['assigned', 'in_progress'].includes(t.status)).length || 0;
    const overdueTasks = tasks?.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      return deadline < now && ['assigned', 'in_progress'].includes(t.status);
    }).length || 0;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const mobile = isMobileUser(ctx);
    
    if (mobile) {
      const stats = {
        total: totalTasks,
        completed: completedTasks,
        active: activeTasks,
        overdue: overdueTasks
      };
      const statsMessage = formatMobileStats(stats);
      await ctx.reply(statsMessage);
    } else {
      const statsMessage = `📊 СТАТИСТИКА РАБОЧЕГО ПРОСТРАНСТВА

┌─────────────────────────────┐
│ 📈 Общая статистика         │
├─────────────────────────────┤
│ Всего задач: ${totalTasks}              │
│ Выполнено: ${completedTasks} (${completionRate}%)        │
│ Активных: ${activeTasks}                 │
│ Просроченных: ${overdueTasks}             │
└─────────────────────────────┘

${overdueTasks > 0 ? `⚠️ Внимание: ${overdueTasks} задач просрочено!` : '✅ Все задачи в срок!'}`;
      
      await ctx.reply(statsMessage);
    }
  } catch (e) {
    logger.error({ e }, 'stats button failed');
    await ctx.reply('Не удалось загрузить статистику.');
  }
});

// Admin button: Тест онбординга
bot.hears('🧪 Тест онбординга', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'Unknown';
    
    const userData = {
      username: username,
      telegramId: telegramId,
      workspace: 'Тестовое пространство'
    };
    
    const onboardingStep = getOnboardingStep(1);
    const message = formatOnboardingMessage(onboardingStep.message, userData);
    
    // Store onboarding state
    userStates.set(telegramId, {
      action: 'onboarding',
      step: 1,
      data: userData
    });
    
    await ctx.reply('🧪 Тестирование онбординга:', onboardingStep.keyboard);
  } catch (e) {
    logger.error({ e }, 'test onboarding button failed');
    await ctx.reply('Не удалось запустить тест онбординга.');
  }
});

// Workspace management command
bot.command('workspace', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.reply('Сначала присоединитесь к рабочему пространству.');
    }
    
    await ctx.reply('🏢 Панель управления воркспейсом', workspaceManagementKeyboard());
  } catch (e) {
    logger.error({ e }, 'workspace command failed');
    await ctx.reply('Не удалось загрузить панель управления.');
  }
});

// Admin button: Добавить чек-лист
bot.hears('📋 Добавить чек-лист', async (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.session = ctx.session || {};
  ctx.session.expecting = 'checklist_name';
  await ctx.reply('Название чек-листа?');
});

// Admin button: Управление
bot.hears('👥 Управление', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    const wsId = me?.workspace_id;
    if (!wsId) return ctx.reply('Вы не в рабочем пространстве.');
    const users = await listUsersByWorkspace(wsId);
    const roles = await listRoles();
    for (const u of users) {
      const buttons = roles.slice(0, 5).map((r) => Markup.button.callback(r.name, `role:set:${u.id}:${r.id}`));
      await ctx.reply(`@${u.username || 'user'} (XP: ${u.total_xp})`, Markup.inlineKeyboard([buttons]));
    }
  } catch (e) {
    logger.error({ e }, 'manage_users failed');
    await ctx.reply('Не удалось загрузить пользователей.');
  }
});

// Admin button: Проблемы
bot.hears('🚨 Проблемы', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const { data: me } = await supabase.from('users').select('workspace_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
    if (!me?.workspace_id) return ctx.reply('Сначала присоединитесь к рабочему пространству.');
    const items = await listIssues(me.workspace_id);
    if (!items.length) return ctx.reply('Нет проблем.');
    for (const it of items) {
      const txt = `#${it.id.slice(0,8)} [${it.status}] ${it.category}\n${it.description}${it.photo_url ? `\n${it.photo_url}` : ''}`;
      await ctx.reply(txt, issueActionsKeyboard(it.id));
    }
  } catch (e) { logger.error({ e }, 'issues list'); await ctx.reply('Не удалось загрузить проблемы'); }
});

// Tasks button - show personal tasks
bot.hears('📋 Мои задачи', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    if (!me?.workspace_id) return ctx.reply('Присоединитесь к рабочему пространству чтобы видеть задачи.');
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, status, deadline')
      .eq('assigned_to', me.id)
      .in('status', ['assigned', 'in_progress', 'pending_review'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!tasks?.length) return ctx.reply('У вас пока нет назначенных задач.');
    
    const mobile = isMobileUser(ctx);
    const formattedList = formatTaskList(tasks, ctx.from.username, mobile);
    await ctx.reply(formattedList, taskListKeyboard(tasks));
  } catch (e) {
    logger.error({ e }, 'my tasks menu failed');
    await ctx.reply('Не удалось загрузить задачи.');
  }
});

// View personal task details
bot.action(/task:view:(?<taskId>[^:]+)/, async (ctx) => {
  try {
    const { taskId } = ctx.match.groups;
    const task = await getSimpleTask(taskId);
    
    const deadline = formatDeadline(task.deadline);
    const msg = `┌─────────────────────────────┐
│ 📋 ${task.title}              │
│                             │
│ ${task.description}         │
│                             │
│ Deadline: ${deadline}     │
│                             │
│ [✅ Выполнено] [⚠️ Проблема] │
└─────────────────────────────┘`;
    
    await ctx.editMessageText(msg, simpleTaskKeyboard(taskId));
  } catch (e) {
    logger.error({ e }, 'view task failed');
    await ctx.answerCbQuery('Не удалось загрузить задачу');
  }
});

// Complete simple personal task
bot.action(/task:complete:(?<taskId>[^:]+)/, async (ctx) => {
  try {
    const { taskId } = ctx.match.groups;
    const task = await getSimpleTask(taskId);
    
    // Mark task as pending review
    await markTaskPendingReview(taskId);
    
    // Notify admin
    const adminChatId = await getAdminChatId();
    if (adminChatId) {
      const { data: usr } = await supabase.from('users').select('username').eq('id', task.assigned_to).maybeSingle();
      const msg = `📝 Задача выполнена, ожидает проверки\n\n` +
                  `Название: ${task.title}\n` +
                  `Исполнитель: @${usr?.username || 'unknown'}\n\n` +
                  `Готова для проверки администратором.`;
      await bot.telegram.sendMessage(adminChatId, msg, reviewActionsKeyboard(taskId));
    }
    
    await ctx.editMessageText('✅ Задача выполнена! Отправлена на проверку администратору.');
  } catch (e) {
    logger.error({ e }, 'complete task');
    await ctx.answerCbQuery('Не удалось завершить задачу');
  }
});

// Report issue with simple task
bot.action(/task:issue:(?<taskId>[^:]+)/, async (ctx) => {
  try {
    const { taskId } = ctx.match.groups;
    const task = await getSimpleTask(taskId);
    
    // Mark task as pending review with issues
    await markTaskPendingReview(taskId);
    
    // Start issue report flow
    ctx.session = ctx.session || {};
    ctx.session.report = { step: 'category', taskId: taskId };
    await ctx.editMessageText('Задача отмечена с проблемами. Опишите проблему:');
    await ctx.reply('Выберите категорию проблемы:', issueCategoriesKeyboard());
  } catch (e) {
    logger.error({ e }, 'report task issue');
    await ctx.answerCbQuery('Не удалось сообщить о проблеме');
  }
});

// Admin approves task
bot.action(/task:approve:(?<taskId>[^:]+)/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  try {
    const { taskId } = ctx.match.groups;
    await markTaskApproved(taskId);
    
    // Get task details
    const task = await getSimpleTask(taskId);
    
    const { data: usr } = await supabase.from('users').select('id, telegram_id, username').eq('id', task.assigned_to).maybeSingle();
    
    // Notify user
    if (usr?.telegram_id) {
      await bot.telegram.sendMessage(
        usr.telegram_id, 
        `✅ Задача одобрена!\n\n` +
        `"${task.title}"\n\n` +
        `Задача выполнена успешно.`
      );
    }
    
    // Update admin message
    await ctx.editMessageText(
      `✅ Одобрено @${ctx.from.username}\n\n` +
      `Задача: ${task.title}\n` +
      `Исполнитель: @${usr?.username}`
    );
    console.log('[approve] Task approved:', taskId);
  } catch (e) { 
    logger.error({ e }, 'approve task'); 
    await ctx.answerCbQuery('Не удалось одобрить');
  }
});

// Admin rejects task
bot.action(/task:reject:(?<taskId>[^:]+)/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  try {
    const { taskId } = ctx.match.groups;
    await markTaskRejected(taskId);
    
    // Get task details
    const task = await getSimpleTask(taskId);
    
    const { data: usr } = await supabase.from('users').select('telegram_id, username').eq('id', task.assigned_to).maybeSingle();
    
    // Notify user
    if (usr?.telegram_id) {
      await bot.telegram.sendMessage(
        usr.telegram_id, 
        `❌ Требуются изменения по задаче\n\n` +
        `"${task.title}"\n\n` +
        `Пожалуйста, пересмотрите и отправьте заново.`
      );
    }
    
    // Update admin message
    await ctx.editMessageText(
      `❌ Требуются изменения от @${ctx.from.username}\n\n` +
      `Задача: ${task.title}\n` +
      `Исполнитель: @${usr?.username}`
    );
    console.log('[reject] Task rejected:', taskId);
  } catch (e) { 
    logger.error({ e }, 'reject task'); 
    await ctx.answerCbQuery('Не удалось отклонить');
  }
});

// Admin: /create_workspace
bot.command('create_workspace', async (ctx) => {
  if (!isAdmin(ctx)) return;
  await ctx.reply('Reply to this message with your workspace name:', Markup.forceReply());
  console.log('[create_workspace] Prompted for workspace name by', ctx.from.username || ctx.from.id);
});

// Handle reply to workspace name prompt via force-reply
bot.on('message', async (ctx, next) => {
  const promptText = ctx.message?.reply_to_message?.text?.toLowerCase() || '';
  if (promptText.includes('workspace name')) {
    try {
      const name = String(ctx.message.text || '').trim().slice(0, 80);
      console.log('[create_workspace] Received name via reply:', name);
      console.log('[create_workspace] Attempting DB insert');
      const ws = await createWorkspace(name);
      console.log('[create_workspace] Insert success:', ws);
      const userId = await upsertUserByTelegram(ctx.from.id, ctx.from.username || ctx.from.first_name || 'Unknown');
      await setUserWorkspace(userId, ws.id);
      const roles = await listRoles();
      const owner = roles.find((r) => r.name === 'Owner');
      if (owner) {
        await assignUserRole(userId, owner.id);
        console.log('[create_workspace] Assigned Owner role to creator');
      } else {
        console.warn('[create_workspace] Owner role not found, skipping role assignment');
      }
      const inviteLink = `t.me/isib_manager_bot?start=invite_${ws.invite_code}`;
      console.log('[create_workspace] Responding with invite link:', inviteLink);
      await ctx.reply(`Created workspace “${ws.name}”. Invite: ${inviteLink}`);
    } catch (e) {
      console.error('[create_workspace] ERROR:', e);
      logger.error({ e }, 'create_workspace failed');
      await ctx.reply('Failed to create workspace.');
    }
    return; // do not pass to other handlers
  }
  return next();
});

// Join workspace via button
bot.action(/ws:join:(?<code>[A-Z0-9]{6})/, async (ctx) => {
  try {
    const code = ctx.match.groups.code;
    const ws = await getByInviteCode(code);
    if (!ws) return ctx.answerCbQuery('Ссылка недействительна');
    const userId = await upsertUserByTelegram(ctx.from.id, ctx.from.username || ctx.from.first_name || 'Unknown');
    await setUserWorkspace(userId, ws.id);
    await ctx.editMessageText(`✅ Присоединились к рабочему пространству: ${ws.name}`);
    await ctx.reply('Теперь вы можете видеть и выполнять задачи!', mainMenu());
  } catch (e) {
    logger.error({ e }, 'join workspace failed');
    await ctx.answerCbQuery('Не удалось присоединиться');
  }
});

// Join workspace button handler
bot.hears('🏢 Присоединиться к workspace', async (ctx) => {
  await ctx.reply('Введите invite-код рабочего пространства (6 символов):', Markup.forceReply());
  const userId = ctx.from.id;
  userStates.set(userId, {
    action: 'joining_workspace',
    step: 'code'
  });
});

// Admin: Create workspace button
bot.action('admin:create_workspace', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  await ctx.editMessageText('Введите название рабочего пространства:', Markup.forceReply());
  const userId = ctx.from.id;
  userStates.set(userId, {
    action: 'creating_workspace',
    step: 'name'
  });
});

// Admin panel
bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ У вас нет доступа к админ-панели.');
  }
  await ctx.reply('🏢 **Админ-панель**\n\nВыберите действие:', adminMenu());
});

// Manage users (list and assign roles)
bot.command('manage_users', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    // Find admin user workspace
    const { data: me, error } = supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    if (error) throw error;
    const wsId = (await me)?.workspace_id;
    if (!wsId) return ctx.reply('You are not in a workspace.');
    const users = await listUsersByWorkspace(wsId);
    const roles = await listRoles();
    for (const u of users) {
      const buttons = roles.slice(0, 5).map((r) => Markup.button.callback(r.name, `role:set:${u.id}:${r.id}`));
      await ctx.reply(`@${u.username || 'user'} (XP: ${u.total_xp})`, Markup.inlineKeyboard([buttons]));
    }
  } catch (e) {
    logger.error({ e }, 'manage_users failed');
    await ctx.reply('Failed to list users.');
  }
});

bot.action(/role:set:(?<userId>[^:]+):(?<roleId>\d+)/, async (ctx) => {
  try {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Not allowed');
    const { userId, roleId } = ctx.match.groups;
    await assignUserRole(userId, Number(roleId));
    await ctx.answerCbQuery('Role assigned');
  } catch (e) {
    logger.error({ e }, 'assign role failed');
    await ctx.answerCbQuery('Failed');
  }
});

// Deadline quick selection handlers
bot.action(/deadline:(today|tomorrow):(\d{1,2}):(\d{2})/, async (ctx) => {
  try {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state || state.action !== 'creating_task' || state.step !== 'deadline') {
      return ctx.answerCbQuery('Session expired');
    }
    
    const [, dayType, hours, minutes] = ctx.match;
    const now = new Date();
    const deadline = new Date(now);
    
    if (dayType === 'tomorrow') {
      deadline.setDate(deadline.getDate() + 1);
    }
    
    deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (isDateInPast(deadline.toISOString())) {
      return ctx.answerCbQuery('Дата в прошлом');
    }
    
    state.data.deadline = deadline.toISOString();
    state.step = 'done';
    userStates.set(userId, state);
    
    await ctx.editMessageText(`Дедлайн установлен: ${formatDeadline(deadline.toISOString())}\n\nЗадача будет создана.`);
  } catch (e) {
    logger.error({ e }, 'deadline quick selection failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

bot.action(/deadline:relative:(.+)/, async (ctx) => {
  try {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state || state.action !== 'creating_task' || state.step !== 'deadline') {
      return ctx.answerCbQuery('Session expired');
    }
    
    const [, relative] = ctx.match;
    const now = new Date();
    const deadline = new Date(now);
    
    if (relative === '3h') {
      deadline.setHours(deadline.getHours() + 3);
    } else if (relative === '1d') {
      deadline.setDate(deadline.getDate() + 1);
      deadline.setHours(18, 0, 0, 0);
    }
    
    if (isDateInPast(deadline.toISOString())) {
      return ctx.answerCbQuery('Дата в прошлом');
    }
    
    state.data.deadline = deadline.toISOString();
    state.step = 'done';
    userStates.set(userId, state);
    
    await ctx.editMessageText(`Дедлайн установлен: ${formatDeadline(deadline.toISOString())}\n\nЗадача будет создана.`);
  } catch (e) {
    logger.error({ e }, 'deadline relative selection failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

bot.action('deadline:custom', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state || state.action !== 'creating_task' || state.step !== 'deadline') {
      return ctx.answerCbQuery('Session expired');
    }
    
    await ctx.editMessageText('Введите дату и время:\n\nПримеры:\n• "завтра в 15:00"\n• "2 октября в 18:00"\n• "через 5 часов"\n• "в пятницу в 12:00"', deadlineCustomKeyboard());
  } catch (e) {
    logger.error({ e }, 'deadline custom failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

bot.action('deadline:quick', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state || state.action !== 'creating_task' || state.step !== 'deadline') {
      return ctx.answerCbQuery('Session expired');
    }
    
    await ctx.editMessageText('Когда нужно сделать?', deadlineQuickKeyboard());
  } catch (e) {
    logger.error({ e }, 'deadline quick back failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

// Task management handlers
bot.action(/task:details:(?<taskId>[^:]+)/, async (ctx) => {
  try {
    const { taskId } = ctx.match.groups;
    const task = await getTaskDetails(taskId);
    
    const formattedDetails = formatTaskDetails(task, ctx.from.username);
    await ctx.editMessageText(formattedDetails, taskDetailsKeyboard(taskId));
  } catch (e) {
    logger.error({ e }, 'task details failed');
    await ctx.answerCbQuery('Не удалось загрузить детали');
  }
});

bot.action(/task:remind:(?<taskId>[^:]+)/, async (ctx) => {
  try {
    const { taskId } = ctx.match.groups;
    const task = await getTaskDetails(taskId);
    
    if (!task.assigned_to?.telegram_id) {
      return ctx.answerCbQuery('Пользователь не найден');
    }
    
    const reminderMessage = formatReminderMessage(task, ctx.from.username);
    
    // Send reminder to user
    await bot.telegram.sendMessage(task.assigned_to.telegram_id, reminderMessage);
    
    // Confirm to admin
    await ctx.answerCbQuery('Напоминание отправлено!');
    
    // Update task status to in_progress if it was assigned
    if (task.status === 'assigned') {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);
      
      if (error) {
        logger.error({ error }, 'Failed to update task status');
      }
    }
  } catch (e) {
    logger.error({ e }, 'task remind failed');
    await ctx.answerCbQuery('Не удалось отправить напоминание');
  }
});

// Task filters
bot.action(/tasks:filter:(?<filter>[^:]+)/, async (ctx) => {
  try {
    const { filter } = ctx.match.groups;
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
    
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Нет рабочего пространства');
    }
    
    const tasks = await getAllTasksForAdmin(me.workspace_id, { status: filter });
    const mobile = isMobileUser(ctx);
    const formattedList = formatTaskList(tasks, ctx.from.username, mobile);
    
    await ctx.editMessageText(formattedList, taskListKeyboard(tasks, filter));
  } catch (e) {
    logger.error({ e }, 'task filter failed');
    await ctx.answerCbQuery('Ошибка фильтрации');
  }
});

// Task sorting
bot.action(/tasks:sort:(?<sort>[^:]+)/, async (ctx) => {
  try {
    const { sort } = ctx.match.groups;
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
    
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Нет рабочего пространства');
    }
    
    let tasks = await getAllTasksForAdmin(me.workspace_id);
    
    // Apply sorting
    if (sort === 'deadline') {
      tasks.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sort === 'status') {
      const statusOrder = { 'assigned': 1, 'in_progress': 2, 'pending_review': 3, 'approved': 4, 'rejected': 5 };
      tasks.sort((a, b) => (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999));
    } else if (sort === 'assignee') {
      tasks.sort((a, b) => (a.assigned_to?.username || '').localeCompare(b.assigned_to?.username || ''));
    }
    
    const formattedList = formatTaskList(tasks, ctx.from.username);
    await ctx.editMessageText(formattedList, taskListKeyboard(tasks, 'all', sort));
  } catch (e) {
    logger.error({ e }, 'task sort failed');
    await ctx.answerCbQuery('Ошибка сортировки');
  }
});

bot.action('tasks:list', async (ctx) => {
  try {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
    
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Нет рабочего пространства');
    }
    
    const tasks = await getAllTasksForAdmin(me.workspace_id);
    const mobile = isMobileUser(ctx);
    const formattedList = formatTaskList(tasks, ctx.from.username, mobile);
    
    await ctx.editMessageText(formattedList, taskListKeyboard(tasks));
  } catch (e) {
    logger.error({ e }, 'tasks list failed');
    await ctx.answerCbQuery('Ошибка загрузки');
  }
});

bot.action('tasks:archive', async (ctx) => {
  try {
    await ctx.answerCbQuery('Архив пока не реализован');
  } catch (e) {
    logger.error({ e }, 'tasks archive failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

bot.action('admin:create_task', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  const userId = ctx.from.id;
  userStates.set(userId, {
    action: 'creating_task',
    step: 'title',
    data: {}
  });
  
  console.log('[create_task] Started task creation for user', userId);
  await ctx.editMessageText('Название задачи?', Markup.forceReply());
});

bot.action('admin:menu', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  await ctx.editMessageText('🏢 **Админ-панель**\n\nВыберите действие:', adminMenu());
});

// Admin: Statistics
bot.action('admin:stats', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Сначала присоединитесь к рабочему пространству.');
    }
    
    const workspace = await getWorkspaceInfo(me.workspace_id);
    const stats = await getWorkspaceStats(me.workspace_id);
    const statsText = formatWorkspaceInfo(workspace, stats);
    
    await ctx.editMessageText(statsText, Markup.inlineKeyboard([
      [Markup.button.callback('« Назад', 'admin:menu')]
    ]));
  } catch (e) {
    logger.error({ e }, 'admin stats failed');
    await ctx.answerCbQuery('Не удалось загрузить статистику');
  }
});

// Admin: Issues
bot.action('admin:issues', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Сначала присоединитесь к рабочему пространству.');
    }
    
    const issues = await listIssues(me.workspace_id);
    
    if (issues.length === 0) {
      await ctx.editMessageText('🚨 **Проблемы**\n\nНет активных проблем.', Markup.inlineKeyboard([
        [Markup.button.callback('« Назад', 'admin:menu')]
      ]));
      return;
    }
    
    let issuesText = '🚨 **Проблемы**\n\n';
    issues.forEach((issue, index) => {
      const statusEmoji = issue.status === 'resolved' ? '✅' : issue.status === 'in_progress' ? '🟡' : '🔴';
      issuesText += `${statusEmoji} **${issue.category}**\n`;
      issuesText += `Статус: ${issue.status}\n`;
      if (issue.description) {
        issuesText += `Описание: ${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}\n`;
      }
      issuesText += `\n`;
    });
    
    await ctx.editMessageText(issuesText, Markup.inlineKeyboard([
      [Markup.button.callback('« Назад', 'admin:menu')]
    ]));
  } catch (e) {
    logger.error({ e }, 'admin issues failed');
    await ctx.answerCbQuery('Не удалось загрузить проблемы');
  }
});

// Admin: Manage users
bot.action('admin:manage_users', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Сначала присоединитесь к рабочему пространству.');
    }
    
    const users = await getWorkspaceUsers(me.workspace_id);
    const roles = await getWorkspaceRoles(me.workspace_id);
    
    if (users.length === 0) {
      await ctx.editMessageText('👥 **Управление пользователями**\n\nВ workspace пока нет пользователей.', Markup.inlineKeyboard([
        [Markup.button.callback('« Назад', 'admin:menu')]
      ]));
      return;
    }
    
    let usersText = `👥 **Управление пользователями**\n\nВсего пользователей: ${users.length}\n\n`;
    
    users.forEach((user, index) => {
      const userRoles = user.user_roles?.map(ur => ur.roles?.name).filter(Boolean).join(', ') || 'Без роли';
      usersText += `${index + 1}. @${user.username || 'user'}\n`;
      usersText += `   Роль: ${userRoles}\n`;
      usersText += `   ID: ${user.telegram_id}\n\n`;
    });
    
    await ctx.editMessageText(usersText, userManagementKeyboard(users, roles));
  } catch (e) {
    logger.error({ e }, 'admin manage users failed');
    await ctx.answerCbQuery('Не удалось загрузить пользователей');
  }
});

bot.action('admin:my_tasks', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Недостаточно прав');
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('Сначала присоединитесь к рабочему пространству.');
    }
    
    const tasks = await getAllTasksForAdmin(me.workspace_id);
    const mobile = isMobileUser(ctx);
    const formattedList = formatTaskList(tasks, ctx.from.username, mobile);
    
    await ctx.editMessageText(formattedList, taskListKeyboard(tasks));
  } catch (e) {
    logger.error({ e }, 'my_tasks button failed');
    await ctx.answerCbQuery('Не удалось загрузить задачи.');
  }
});

// Main menu button
bot.action('main_menu', async (ctx) => {
  try {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    const isAdmin = String(ctx.from.username) === String(adminId);
    
    await ctx.editMessageText(
      'Добро пожаловать в систему управления задачами!\n\nИспользуйте меню для управления задачами и другими функциями.',
      isAdminUser ? adminMainMenu() : mainMenu()
    );
  } catch (e) {
    logger.error({ e }, 'main_menu action failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

// Onboarding handlers
bot.action(/onboarding:(.+)/, async (ctx) => {
  try {
    const action = ctx.match[1];
    const userId = String(ctx.from.id);
    const state = userStates.get(userId);
    
    console.log('[onboarding] Action:', action, 'UserId:', userId, 'State:', state);
    
    if (!state || state.action !== 'onboarding') {
      console.log('[onboarding] No state found for user:', userId);
      return ctx.answerCbQuery('Сессия истекла. Попробуйте /test_onboarding снова.');
    }
    
    let nextStep = state.step;
    let userData = state.data;
    
    switch (action) {
      case 'next':
        nextStep = Math.min(state.step + 1, 4);
        break;
        
      case 'prev':
        nextStep = Math.max(state.step - 1, 1);
        break;
        
      case 'help':
        const helpMessage = getHelpMessage();
        await ctx.editMessageText(helpMessage, Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Назад к онбордингу', 'onboarding:back')]
        ]));
        return;
        
      case 'back':
        // Return to current onboarding step
        break;
        
      case 'edit_name':
        await ctx.editMessageText('Введите новое имя:');
        userStates.set(userId, { ...state, action: 'editing_name' });
        return;
        
      case 'change_workspace':
        await ctx.editMessageText('Для смены рабочего пространства обратитесь к админу.');
        return;
        
      case 'complete':
        // Complete onboarding
        userStates.delete(userId);
        const welcomeText = `🎉 Онбординг завершен!\n\nДобро пожаловать в систему управления задачами!\n\nИспользуйте меню для управления задачами и другими функциями.`;
        await ctx.editMessageText(welcomeText, Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]));
        return;
    }
    
    // Update state
    userStates.set(userId, { ...state, step: nextStep });
    
    // Get next step
    const onboardingStep = getOnboardingStep(nextStep);
    const message = formatOnboardingMessage(onboardingStep.message, userData);
    
    await ctx.editMessageText(message, onboardingStep.keyboard);
  } catch (e) {
    logger.error({ e }, 'onboarding action failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

// Handle name editing during onboarding
bot.on('text', async (ctx, next) => {
  const userId = String(ctx.from.id);
  const state = userStates.get(userId);
  
  if (state?.action === 'editing_name') {
    const newName = ctx.message.text.trim();
    if (newName.length < 2) {
      await ctx.reply('Имя должно быть длиннее 2 символов. Попробуйте еще раз:');
      return;
    }
    
    // Update user name in database
    try {
      await supabase
        .from('users')
        .update({ username: newName })
        .eq('telegram_id', String(userId));
      
      // Update state data
      state.data.username = newName;
      userStates.set(userId, { ...state, action: 'onboarding' });
      
      // Return to onboarding step 2
      const onboardingStep = getOnboardingStep(2);
      const message = formatOnboardingMessage(onboardingStep.message, state.data);
      
      await ctx.reply('Имя обновлено!', Markup.removeKeyboard());
      await ctx.reply(message, onboardingStep.keyboard);
    } catch (error) {
      logger.error({ error }, 'Failed to update username');
      await ctx.reply('Не удалось обновить имя. Попробуйте еще раз:');
    }
    return;
  }
  
  return next();
});

// Admin: /my_quests - show all assigned quests
bot.command('my_quests', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.reply('Сначала присоединитесь к рабочему пространству.');
    }
    
    const quests = await getAllQuestsForAdmin(me.workspace_id);
    const mobile = isMobileUser(ctx);
    const formattedList = formatQuestList(quests, ctx.from.username, mobile);
    
    await ctx.reply(formattedList, questListKeyboard(quests));
  } catch (e) {
    logger.error({ e }, 'my_quests command failed');
    await ctx.reply('Не удалось загрузить квесты.');
  }
});

// Admin: /create_quest (personal) - using userStates Map
bot.command('create_quest', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const userId = ctx.from.id;
  userStates.set(userId, {
    action: 'creating_task',
    step: 'title',
    data: {}
  });
  
  console.log('[create_task] Started task creation for user', userId);
  await ctx.reply('Название задачи?', Markup.forceReply());
});

// Handle task creation conversation flow
async function handleTaskCreation(ctx, state) {
  const text = ctx.message.text;
  const userId = ctx.from.id;
  
  console.log(`[handleTaskCreation] User ${userId} at step "${state.step}" sent:`, text);
  
  try {
    switch(state.step) {
      case 'title':
        state.data.title = text;
        state.step = 'description';
        userStates.set(userId, state);
        await ctx.reply('Описание задачи?', Markup.forceReply());
        break;
        
      case 'description':
        state.data.description = text;
        state.step = 'assignee';
        userStates.set(userId, state);
        await ctx.reply('Назначить (username или Telegram ID)?', Markup.forceReply());
        break;
        
      case 'assignee':
        state.data.assignee = text.replace('@', '');
        state.step = 'deadline';
        userStates.set(userId, state);
        await ctx.reply('Когда нужно сделать?\n\nВыберите быстро или введите дату:', deadlineQuickKeyboard());
        break;
        
      case 'deadline':
        // Parse natural language deadline
        const parsedDeadline = parseNaturalDate(text);
        if (!parsedDeadline) {
          await ctx.reply('Не удалось распознать дату. Попробуйте еще раз или используйте формат "завтра в 15:00", или выберите из кнопок:', deadlineQuickKeyboard());
          return;
        }
        
        if (isDateInPast(parsedDeadline)) {
          await ctx.reply('Дата не может быть в прошлом. Попробуйте другую дату:', deadlineQuickKeyboard());
          return;
        }
        
        state.data.deadline = parsedDeadline;
        state.step = 'done';
        userStates.set(userId, state);
        
        // Create task immediately after deadline is set
        console.log('[handleTaskCreation] Fetching creator workspace for user', ctx.from.id);
        const { data: me, error: meErr } = await supabase.from('users').select('id, workspace_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
        console.log('[handleTaskCreation] Creator:', me, 'Error:', meErr);
        if (!me?.workspace_id) {
          userStates.delete(userId);
          console.warn('[handleTaskCreation] No workspace found for user');
          return ctx.reply('Сначала присоединитесь к рабочему пространству.');
        }
        
        // Resolve assignee
        let assigneeUser = null;
        if (/^\d+$/.test(state.data.assignee)) {
          const { data } = await supabase.from('users').select('id').eq('telegram_id', state.data.assignee).maybeSingle();
          assigneeUser = data?.id;
        } else {
          const { data } = await supabase.from('users').select('id').eq('username', state.data.assignee).maybeSingle();
          assigneeUser = data?.id;
        }
        if (!assigneeUser) {
          userStates.delete(userId);
          return ctx.reply('Пользователь не найден в рабочем пространстве.');
        }
        
        // Create task
        const taskId = await createPersonalTask(me.workspace_id, me.id, assigneeUser, state.data.title, state.data.description, state.data.deadline);
        
        // Clear state
        userStates.delete(userId);
        console.log('[handleTaskCreation] Task created successfully');
        await ctx.reply(`✅ Задача создана и назначена.\n\n📋 ${state.data.title}\n${state.data.description}\n\nДедлайн: ${formatDeadline(state.data.deadline)}`);
        break;
    }
  } catch (e) {
    console.error('[handleTaskCreation] ERROR:', e);
    userStates.delete(userId);
    await ctx.reply('Не удалось создать задачу.');
  }
}

bot.on('text', async (ctx, next) => {
  // PRIORITY 1: Check if user is in a conversation state
  const userId = ctx.from.id;
  const state = userStates.get(userId);
  
  if (state?.action === 'creating_task') {
    console.log('[text handler] Routing to handleTaskCreation');
    return handleTaskCreation(ctx, state);
  }
  
  if (state?.action === 'joining_workspace' && state.step === 'code') {
    try {
      const code = String(ctx.message.text || '').trim().toUpperCase();
      if (code.length !== 6) {
        return ctx.reply('Код должен содержать 6 символов. Попробуйте еще раз:', Markup.forceReply());
      }
      const ws = await getByInviteCode(code);
      if (!ws) {
        userStates.delete(userId);
        return ctx.reply('Ссылка-приглашение недействительна. Проверьте код и попробуйте еще раз.');
      }
      const userId_db = await upsertUserByTelegram(ctx.from.id, ctx.from.username || ctx.from.first_name || 'Unknown');
      await setUserWorkspace(userId_db, ws.id);
      userStates.delete(userId);
      await ctx.reply(`✅ Присоединились к рабочему пространству: ${ws.name}\n\nТеперь вы можете видеть и выполнять задачи!`, mainMenu());
    } catch (e) {
      logger.error({ e }, 'join workspace failed');
      userStates.delete(userId);
      await ctx.reply('Не удалось присоединиться к рабочему пространству.');
    }
    return;
  }
  
  if (state?.action === 'creating_workspace' && state.step === 'name') {
    try {
      const name = String(ctx.message.text || '').trim().slice(0, 80);
      if (!name) {
        return ctx.reply('Название не может быть пустым. Попробуйте еще раз:', Markup.forceReply());
      }
      const ws = await createWorkspace(name);
      const userId_db = await upsertUserByTelegram(ctx.from.id, ctx.from.username || ctx.from.first_name || 'Unknown');
      await setUserWorkspace(userId_db, ws.id);
      const roles = await listRoles();
      const owner = roles.find((r) => r.name === 'Владелец' || r.name === 'Owner');
      if (owner) {
        await assignUserRole(userId_db, owner.id);
      }
      const inviteInfo = await generateInviteLink(ws.id);
      userStates.delete(userId);
      await ctx.reply(`✅ Рабочее пространство "${ws.name}" создано!\n\n${formatInviteInfo(inviteInfo)}`, adminMenu());
    } catch (e) {
      logger.error({ e }, 'create workspace failed');
      userStates.delete(userId);
      await ctx.reply('Не удалось создать рабочее пространство.');
    }
    return;
  }
  
  if (state?.action === 'creating_template') {
    try {
      const { data: me } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('telegram_id', String(ctx.from.id))
        .maybeSingle();
      
      if (!me?.workspace_id) {
        userStates.delete(userId);
        return ctx.reply('Сначала присоединитесь к рабочему пространству.');
      }
      
      switch(state.step) {
        case 'name':
          state.data.name = String(ctx.message.text || '').trim();
          state.step = 'title';
          userStates.set(userId, state);
          await ctx.reply('Введите название задачи (например: "Подать заявку на площадку"):', Markup.forceReply());
          break;
          
        case 'title':
          state.data.title = String(ctx.message.text || '').trim();
          state.step = 'description';
          userStates.set(userId, state);
          await ctx.reply('Введите описание задачи:', Markup.forceReply());
          break;
          
        case 'description':
          state.data.description = String(ctx.message.text || '').trim();
          state.step = 'deadline_hours';
          userStates.set(userId, state);
          await ctx.reply('Через сколько часов по умолчанию должен быть дедлайн? (например: 24 для "через сутки"):', Markup.forceReply());
          break;
          
        case 'deadline_hours':
          const hours = parseInt(String(ctx.message.text || '').trim(), 10);
          if (isNaN(hours) || hours < 1) {
            return ctx.reply('Введите число часов (минимум 1):', Markup.forceReply());
          }
          
          const template = await createTaskTemplate(
            me.workspace_id,
            state.data.name,
            state.data.title,
            state.data.description,
            hours
          );
          
          userStates.delete(userId);
          await ctx.reply(
            `✅ Шаблон "${template.name}" создан!\n\n` +
            `**Название задачи:** ${template.title}\n` +
            `**Описание:** ${template.description}\n` +
            `**Дедлайн по умолчанию:** через ${template.default_deadline_hours} часов\n\n` +
            `Теперь вы можете использовать этот шаблон для быстрого создания задач.`,
            adminMenu()
          );
          break;
      }
    } catch (e) {
      logger.error({ e }, 'create template failed');
      userStates.delete(userId);
      await ctx.reply('Не удалось создать шаблон.');
    }
    return;
  }
  
  // PRIORITY 2: Continue to other text handlers
  // If this is a reply to our force-reply prompts, handle and short-circuit
  const replyText = ctx.message?.reply_to_message?.text?.toLowerCase() || '';
  if (ctx.session?.pq?.started && replyText) {
    try {
      if (replyText.includes('название задачи')) {
        ctx.session.pq.title = String(ctx.message.text || '').trim();
        return ctx.reply('Ответьте на это сообщение с описанием задачи:', Markup.forceReply());
      }
      if (replyText.includes('описание задачи')) {
        ctx.session.pq.description = String(ctx.message.text || '').trim();
        return ctx.reply('Ответьте с username (@name) или Telegram ID исполнителя:', Markup.forceReply());
      }
      if (replyText.includes('исполнитель') || replyText.includes('assignee')) {
        ctx.session.pq.assignee = String(ctx.message.text || '').trim().replace('@','');
        return ctx.reply('Ответьте с дедлайном (YYYY-MM-DD или YYYY-MM-DD HH:mm):', Markup.forceReply());
      }
      if (replyText.includes('дедлайн') || replyText.includes('deadline')) {
        const deadline = String(ctx.message.text || '').trim();
        const parsedDeadline = parseNaturalDate(deadline);
        if (!parsedDeadline) {
          return ctx.reply('Не удалось распознать дату. Попробуйте еще раз:');
        }
        if (isDateInPast(parsedDeadline)) {
          return ctx.reply('Дата не может быть в прошлом. Попробуйте другую дату:');
        }
        ctx.session.pq.deadline = parsedDeadline;
        console.log('[create_task] Finalizing task, fetching creator workspace');
        const { data: me, error: meErr } = await supabase.from('users').select('id, workspace_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
        console.log('[create_task] Creator data:', me, 'Error:', meErr);
        if (!me?.workspace_id) { ctx.session.pq = null; return ctx.reply('Сначала присоединитесь к рабочему пространству.'); }
        // Resolve assignee
        let assigneeUser = null;
        if (/^\d+$/.test(ctx.session.pq.assignee)) {
          const { data } = await supabase.from('users').select('id').eq('telegram_id', ctx.session.pq.assignee).maybeSingle();
          assigneeUser = data?.id;
        } else {
          const { data } = await supabase.from('users').select('id').eq('username', ctx.session.pq.assignee).maybeSingle();
          assigneeUser = data?.id;
        }
        if (!assigneeUser) { ctx.session.pq = null; return ctx.reply('Пользователь не найден в рабочем пространстве.'); }
        const taskId = await createPersonalTask(me.workspace_id, me.id, assigneeUser, ctx.session.pq.title, ctx.session.pq.description, ctx.session.pq.deadline);
        const taskData = { ...ctx.session.pq };
        ctx.session.pq = null;
        return ctx.reply(`✅ Задача создана и назначена.\n\n📋 ${taskData.title}\n${taskData.description}\n\nДедлайн: ${formatDeadline(taskData.deadline)}`);
      }
    } catch (e) {
      console.error('[create_quest] ERROR:', e);
      ctx.session.pq = null;
      return ctx.reply('Failed to create quest.');
    }
    return; // handled
  }

  if (!ctx.session || !ctx.session.expecting) return next();
  const step = ctx.session.expecting;
  const text = ctx.message.text.trim();
  if (step.startsWith('pq_')) {
    const { data: me } = await supabase.from('users').select('id, workspace_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
    if (!me?.workspace_id) {
      ctx.session.expecting = null;
      return ctx.reply('Join a workspace first.');
    }
    ctx.session.pq = ctx.session.pq || { creatorId: me.id, workspaceId: me.workspace_id };
    if (step === 'pq_title') {
      ctx.session.pq.title = text; ctx.session.expecting = 'pq_description'; return ctx.reply('Quest description?');
    }
    if (step === 'pq_description') {
      ctx.session.pq.description = text; ctx.session.expecting = 'pq_assignee'; return ctx.reply('Assignee username (@name) or Telegram ID?');
    }
    if (step === 'pq_assignee') {
      ctx.session.pq.assignee = text.replace('@',''); ctx.session.expecting = 'pq_deadline'; return ctx.reply('Deadline (YYYY-MM-DD or YYYY-MM-DD HH:mm)');
    }
    if (step === 'pq_deadline') {
      ctx.session.pq.deadline = text; ctx.session.expecting = 'pq_xp'; return ctx.reply('XP reward (e.g., 200)');
    }
    if (step === 'pq_xp') {
      ctx.session.expecting = null;
      const xp = parseInt(text, 10) || 100;
      // Resolve assignee user id
      let assigneeUser = null;
      if (/^\d+$/.test(ctx.session.pq.assignee)) {
        const { data } = await supabase.from('users').select('id').eq('telegram_id', ctx.session.pq.assignee).maybeSingle();
        assigneeUser = data?.id;
      } else {
        const { data } = await supabase.from('users').select('id').eq('username', ctx.session.pq.assignee).maybeSingle();
        assigneeUser = data?.id;
      }
      if (!assigneeUser) return ctx.reply('Assignee not found in workspace.');
      const questId = await createPersonalQuest(ctx.session.pq.workspaceId, ctx.session.pq.creatorId, assigneeUser, ctx.session.pq.title, ctx.session.pq.description, ctx.session.pq.deadline, xp);
      const questData = { ...ctx.session.pq };
      await ctx.reply(`✅ Personal quest created and assigned.\n\n📋 ${questData.title}\n${questData.description}\n\nDeadline: ${questData.deadline}\nReward: +${xp} XP`);
      ctx.session.pq = null;
    }
    return;
  }
  return next();
});


// Report Issue flow
bot.hears('🛠 Сообщить о проблеме', async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.report = { step: 'category' };
  await ctx.reply('Выберите категорию проблемы:', issueCategoriesKeyboard());
});

bot.action(/issue:cat:(?<cat>.+)/, async (ctx) => {
  ctx.session = ctx.session || {};
  const cat = ctx.match.groups.cat;
  if (!ctx.session.report) ctx.session.report = {};
  ctx.session.report.category = cat;
  ctx.session.report.step = 'description';
  await ctx.editMessageText(`Категория: ${cat}\nОпишите проблему (текст):`);
});

bot.on('text', async (ctx, next) => {
  if (!ctx.session?.report?.step) return next();
  if (ctx.session.report.step !== 'description') return next();
  ctx.session.report.description = ctx.message.text.trim();
  ctx.session.report.step = 'photo';
  await ctx.reply('Отправьте фото (опционально) или отправьте /skip чтобы пропустить.');
});

bot.command('skip', async (ctx) => {
  if (ctx.session?.report?.step === 'photo') {
    ctx.session.report.photoUrl = null;
    await finalizeIssue(ctx);
  }
});

bot.on('photo', async (ctx, next) => {
  if (ctx.session?.report?.step !== 'photo') return next();
  const photos = ctx.message.photo;
  const file = photos[photos.length - 1];
  const fileId = file.file_id;
  const link = await ctx.telegram.getFileLink(fileId);
  ctx.session.report.photoUrl = String(link);
  await finalizeIssue(ctx);
});

async function finalizeIssue(ctx) {
  try {
    const { data: me } = await supabase.from('users').select('id, workspace_id, telegram_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
    if (!me?.id) return ctx.reply('Сначала отправьте /start.');
    const id = await createIssue(me.id, ctx.session.report.category, ctx.session.report.description, ctx.session.report.photoUrl, me.workspace_id);
    await ctx.reply('Проблема зарегистрирована. Спасибо!');
    // Notify admin
    const adminChatId = await getAdminChatId();
    if (adminChatId) {
      const caption = `🚨 Новая проблема от @${ctx.from.username || ctx.from.id}\nКатегория: ${ctx.session.report.category}\n${ctx.session.report.description}`;
      await bot.telegram.sendMessage(adminChatId, caption, { disable_web_page_preview: true });
    }
    ctx.session.report = null;
  } catch (e) {
    logger.error({ e }, 'finalizeIssue');
    await ctx.reply('Не удалось отправить проблему.');
  }
}

// Admin: /issues
bot.command('issues', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const { data: me } = await supabase.from('users').select('workspace_id').eq('telegram_id', String(ctx.from.id)).maybeSingle();
    if (!me?.workspace_id) return ctx.reply('Join a workspace first.');
    const items = await listIssues(me.workspace_id);
    if (!items.length) return ctx.reply('No issues.');
    for (const it of items) {
      const txt = `#${it.id.slice(0,8)} [${it.status}] ${it.category}\n${it.description}${it.photo_url ? `\n${it.photo_url}` : ''}`;
      await ctx.reply(txt, issueActionsKeyboard(it.id));
    }
  } catch (e) { logger.error({ e }, 'issues list'); await ctx.reply('Failed to load issues'); }
});

bot.action(/issue:status:(?<id>[^:]+):(?<status>new|in_progress|resolved)/, async (ctx) => {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (String(ctx.from.username) !== String(adminId)) return ctx.answerCbQuery('Not allowed');
  try {
    const { id, status } = ctx.match.groups;
    await setIssueStatus(id, status);
    await ctx.answerCbQuery('Updated');
  } catch (e) { logger.error({ e }, 'issue status'); await ctx.answerCbQuery('Failed'); }
});

// Enhanced automatic reminders
cron.schedule('0 * * * *', async () => {
  logger.info('Hourly task tick - checking reminders');
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24*60*60*1000);
    const in3h = new Date(now.getTime() + 3*60*60*1000);
    const in1h = new Date(now.getTime() + 60*60*1000);
    
    const { data: dueSoon } = await supabase
      .from('tasks')
      .select(`
        id, title, deadline, assigned_to, status,
        assigned_to:users!assigned_to(username, telegram_id)
      `)
      .in('status', ['assigned','in_progress']);
    
    for (const task of dueSoon || []) {
      if (!task.deadline || !task.assigned_to?.telegram_id) continue;
      
      const dl = new Date(task.deadline);
      const timeToDeadline = Math.round((dl - now) / (1000 * 60 * 60)); // hours
      
      let reminderMessage = '';
      let shouldSend = false;
      
      if (timeToDeadline <= 0) {
        // Overdue
        reminderMessage = `🔴 ЗАДАЧА ПРОСРОЧЕНА!\n\n"${task.title}"\nДедлайн: ${formatDeadline(task.deadline)}\n\nСрочно выполни! ⚡`;
        shouldSend = true;
      } else if (timeToDeadline <= 1) {
        // 1 hour reminder
        reminderMessage = `⏰ СРОЧНО! Через ${timeToDeadline}ч\n\n"${task.title}"\nДедлайн: ${formatDeadline(task.deadline)}\n\nПоторопись! 🏃‍♂️`;
        shouldSend = true;
      } else if (timeToDeadline <= 3) {
        // 3 hour reminder
        reminderMessage = `⚠️ Напоминание: через ${timeToDeadline}ч\n\n"${task.title}"\nДедлайн: ${formatDeadline(task.deadline)}\n\nНе забудь! 💪`;
        shouldSend = true;
      } else if (timeToDeadline <= 24) {
        // 24 hour reminder
        reminderMessage = `📅 Завтра дедлайн!\n\n"${task.title}"\nДедлайн: ${formatDeadline(task.deadline)}\n\nПодготовься! 🎯`;
        shouldSend = true;
      }
      
      if (shouldSend) {
        try {
          await bot.telegram.sendMessage(task.assigned_to.telegram_id, reminderMessage);
          logger.info(`Sent reminder for task ${task.id} to user ${task.assigned_to.username}`);
        } catch (error) {
          logger.error({ error, taskId: task.id, userId: task.assigned_to.telegram_id }, 'Failed to send reminder');
        }
      }
    }
  } catch (e) { 
    logger.error({ e }, 'reminders tick failed'); 
  }
});

// Workspace management handlers
bot.action('workspace:info', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('No workspace');
    }
    
    const workspace = await getWorkspaceInfo(me.workspace_id);
    const stats = await getWorkspaceStats(me.workspace_id);
    const info = formatWorkspaceInfo(workspace, stats);
    
    await ctx.editMessageText(info, workspaceManagementKeyboard());
  } catch (e) {
    logger.error({ e }, 'workspace info failed');
    await ctx.answerCbQuery('Ошибка загрузки');
  }
});

bot.action('workspace:invite', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('No workspace');
    }
    
    const inviteInfo = await generateInviteLink(me.workspace_id);
    const message = formatInviteInfo(inviteInfo);
    
    await ctx.editMessageText(message, workspaceManagementKeyboard());
  } catch (e) {
    logger.error({ e }, 'workspace invite failed');
    await ctx.answerCbQuery('Ошибка генерации ссылки');
  }
});

bot.action('workspace:users', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('No workspace');
    }
    
    const users = await getWorkspaceUsers(me.workspace_id);
    const message = `👥 **Пользователи воркспейса (${users.length})**\n\nВыберите пользователя для управления:`;
    
    await ctx.editMessageText(message, userManagementKeyboard(users));
  } catch (e) {
    logger.error({ e }, 'workspace users failed');
    await ctx.answerCbQuery('Ошибка загрузки пользователей');
  }
});

bot.action('workspace:roles', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('No workspace');
    }
    
    const roles = await getWorkspaceRoles(me.workspace_id);
    const message = `🎭 **Роли воркспейса (${roles.length})**\n\nВыберите роль для управления:`;
    
    await ctx.editMessageText(message, roleManagementKeyboard(roles));
  } catch (e) {
    logger.error({ e }, 'workspace roles failed');
    await ctx.answerCbQuery('Ошибка загрузки ролей');
  }
});

bot.action('workspace:stats', async (ctx) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('telegram_id', String(ctx.from.id))
      .maybeSingle();
    
    if (!me?.workspace_id) {
      return ctx.answerCbQuery('No workspace');
    }
    
    const stats = await getWorkspaceStats(me.workspace_id);
    const mobile = isMobileUser(ctx);
    
    if (mobile) {
      const statsMessage = formatMobileStats(stats);
      await ctx.editMessageText(statsMessage, workspaceManagementKeyboard());
    } else {
      const statsMessage = `📊 **СТАТИСТИКА ВОРКСПЕЙСА**

┌─────────────────────────────┐
│ 📈 Общая статистика         │
├─────────────────────────────┤
│ Пользователей: ${stats.totalUsers}            │
│ Всего квестов: ${stats.totalQuests}              │
│ Выполнено: ${stats.completedQuests} (${stats.completionRate}%)        │
│ Активных: ${stats.activeQuests}                 │
│ Просроченных: ${stats.overdueQuests}             │
├─────────────────────────────┤
│ 💎 XP статистика            │
├─────────────────────────────┤
│ Всего XP: ${stats.totalXp}                    │
│ Выдано XP: ${stats.completedXp}                │
│ В процессе: ${stats.totalXp - stats.completedXp}                │
│ Средний XP: ${stats.totalUsers > 0 ? Math.round(stats.totalUserXp / stats.totalUsers) : 0}                │
└─────────────────────────────┘`;
      
      await ctx.editMessageText(statsMessage, workspaceManagementKeyboard());
    }
  } catch (e) {
    logger.error({ e }, 'workspace stats failed');
    await ctx.answerCbQuery('Ошибка загрузки статистики');
  }
});

bot.action('workspace:settings', async (ctx) => {
  try {
    const message = `⚙️ **Настройки воркспейса**

Выберите действие:`;
    
    await ctx.editMessageText(message, workspaceSettingsKeyboard());
  } catch (e) {
    logger.error({ e }, 'workspace settings failed');
    await ctx.answerCbQuery('Ошибка загрузки настроек');
  }
});

bot.action('workspace:management', async (ctx) => {
  try {
    await ctx.editMessageText('🏢 Панель управления воркспейсом', workspaceManagementKeyboard());
  } catch (e) {
    logger.error({ e }, 'workspace management failed');
    await ctx.answerCbQuery('Ошибка');
  }
});

// Ensure polling (disable webhook if it was set previously)
(async () => {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    logger.info('Task Management Bot started (polling)');
  } catch (err) {
    logger.error({ err }, 'Bot failed to launch');
    process.exit(1);
  }
})();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


