import { getClient } from '../database/supabase.js';

export async function getWorkspaceInfo(workspaceId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, invite_code, timezone, created_at')
    .eq('id', workspaceId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getWorkspaceStats(workspaceId) {
  const supabase = getClient();
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, deadline, created_at, assigned_to')
    .eq('workspace_id', workspaceId);
  
  const { data: users } = await supabase
    .from('users')
    .select('id, username')
    .eq('workspace_id', workspaceId);
  
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'approved').length || 0;
  const activeTasks = tasks?.filter(t => ['assigned', 'in_progress'].includes(t.status)).length || 0;
  const overdueTasks = tasks?.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    return deadline < now && ['assigned', 'in_progress'].includes(t.status);
  }).length || 0;
  
  const totalUsers = users?.length || 0;
  
  return {
    totalTasks,
    completedTasks,
    activeTasks,
    overdueTasks,
    totalUsers,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
}

export async function generateInviteLink(workspaceId) {
  const supabase = getClient();
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('invite_code, name')
    .eq('id', workspaceId)
    .single();
  
  if (error) throw error;
  if (!workspace) throw new Error('Workspace not found');
  
  const inviteLink = `t.me/isib_manager_bot?start=invite_${workspace.invite_code}`;
  
  return {
    inviteCode: workspace.invite_code,
    inviteLink,
    workspaceName: workspace.name
  };
}

export async function getWorkspaceRoles(workspaceId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, access_level')
    .order('access_level', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getWorkspaceUsers(workspaceId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      telegram_id,
      created_at,
      user_roles(
        roles(
          id,
          name,
          access_level
        )
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(userId, roleId) {
  const supabase = getClient();
  
  // Remove existing roles
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) throw deleteError;
  
  // Add new role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId });
  
  if (insertError) throw insertError;
}

export async function createRole(name, accessLevel) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('roles')
    .insert({ name, access_level: accessLevel })
    .select('id, name, access_level')
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRole(roleId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId);
  
  if (error) throw error;
}

export function formatWorkspaceInfo(workspace, stats) {
  return `🏢 **Информация о рабочем пространстве**

📌 **Название:** ${workspace.name}
🆔 **ID:** ${workspace.id.slice(0, 8)}...
📅 **Создано:** ${new Date(workspace.created_at).toLocaleDateString('ru-RU')}
⏰ **Часовой пояс:** ${workspace.timezone}

📊 **Статистика:**
• Пользователей: ${stats.totalUsers}
• Задач: ${stats.totalTasks} (${stats.completionRate}% выполнено)
• Активных: ${stats.activeTasks}
• Просроченных: ${stats.overdueTasks}`;
}

export function formatInviteInfo(inviteInfo) {
  return `🔗 **Пригласительная ссылка**

📌 **Рабочее пространство:** ${inviteInfo.workspaceName}
🆔 **Код приглашения:** \`${inviteInfo.inviteCode}\`

🔗 **Ссылка:**
\`${inviteInfo.inviteLink}\`

📋 **Как использовать:**
1. Отправьте ссылку пользователю
2. Пользователь нажмет на ссылку
3. Бот автоматически добавит его в workspace

💡 **Совет:** Ссылка действительна до тех пор, пока workspace существует.`;
}
