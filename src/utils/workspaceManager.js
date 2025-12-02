// Workspace management utilities
import { getClient } from '../database/supabase.js';

const supabase = getClient();

export async function getWorkspaceInfo(workspaceId) {
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      users!inner(
        id,
        username,
        telegram_id,
        total_xp,
        user_roles(
          roles(name, access_level)
        )
      )
    `)
    .eq('id', workspaceId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getWorkspaceStats(workspaceId) {
  const { data: quests } = await supabase
    .from('quests')
    .select('status, xp_reward, created_at, assigned_to')
    .eq('workspace_id', workspaceId)
    .eq('type', 'personal');
  
  const { data: users } = await supabase
    .from('users')
    .select('id, username, total_xp')
    .eq('workspace_id', workspaceId);
  
  const totalQuests = quests?.length || 0;
  const completedQuests = quests?.filter(q => q.status === 'approved').length || 0;
  const activeQuests = quests?.filter(q => ['assigned', 'in_progress'].includes(q.status)).length || 0;
  const overdueQuests = quests?.filter(q => {
    if (!q.deadline) return false;
    const deadline = new Date(q.deadline);
    const now = new Date();
    return deadline < now && ['assigned', 'in_progress'].includes(q.status);
  }).length || 0;
  
  const totalXp = quests?.reduce((sum, q) => sum + (q.xp_reward || 0), 0) || 0;
  const completedXp = quests?.filter(q => q.status === 'approved').reduce((sum, q) => sum + (q.xp_reward || 0), 0) || 0;
  const totalUsers = users?.length || 0;
  const totalUserXp = users?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0;
  
  return {
    totalQuests,
    completedQuests,
    activeQuests,
    overdueQuests,
    totalXp,
    completedXp,
    totalUsers,
    totalUserXp,
    completionRate: totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  };
}

export async function generateInviteLink(workspaceId) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('invite_code, name')
    .eq('id', workspaceId)
    .single();
  
  if (!workspace) throw new Error('Workspace not found');
  
  return {
    code: workspace.invite_code,
    link: `https://t.me/${process.env.BOT_USERNAME || 'your_bot'}?start=invite_${workspace.invite_code}`,
    name: workspace.name
  };
}

export async function getWorkspaceRoles(workspaceId) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('access_level', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getWorkspaceUsers(workspaceId) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      telegram_id,
      total_xp,
      user_roles(
        roles(name, access_level)
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('total_xp', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(userId, roleId) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role_id: roleId
    });
  
  if (error) throw error;
  return true;
}

export async function createRole(workspaceId, name, accessLevel, description = '') {
  const { data, error } = await supabase
    .from('roles')
    .insert({
      workspace_id: workspaceId,
      name,
      access_level: accessLevel,
      description
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRole(roleId) {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId);
  
  if (error) throw error;
  return true;
}

export function formatWorkspaceInfo(workspace, stats) {
  return `🏢 **${workspace.name}**

📊 **Статистика:**
• Пользователей: ${stats.totalUsers}
• Квестов: ${stats.totalQuests} (${stats.completionRate}% выполнено)
• Активных: ${stats.activeQuests}
• Просроченных: ${stats.overdueQuests}

💎 **XP:**
• Всего выдано: ${stats.completedXp}
• В процессе: ${stats.totalXp - stats.completedXp}
• Средний XP пользователя: ${stats.totalUsers > 0 ? Math.round(stats.totalUserXp / stats.totalUsers) : 0}

⏰ **Часовой пояс:** ${workspace.timezone}
📅 **Создан:** ${new Date(workspace.created_at).toLocaleDateString('ru-RU')}`;
}

export function formatInviteInfo(inviteInfo) {
  return `🔗 **Приглашение в ${inviteInfo.name}**

**Код:** \`${inviteInfo.code}\`

**Ссылка:**
\`${inviteInfo.link}\`

📋 **Как пригласить:**
1. Отправь ссылку пользователю
2. Или попроси его ввести команду:
   \`/start ${inviteInfo.code}\`

⚠️ **Код действителен всегда** (пока не изменишь)`;
}





