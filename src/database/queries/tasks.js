import { getClient } from '../supabase.js';

export async function getSimpleTask(taskId) {
  const supabase = getClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, assigned_to, deadline, created_at, created_by')
    .eq('id', taskId)
    .single();
  if (error) throw error;
  return task;
}

export async function markTaskPendingReview(taskId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'pending_review' })
    .eq('id', taskId);
  if (error) throw error;
}

export async function markTaskRejected(taskId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'rejected' })
    .eq('id', taskId);
  if (error) throw error;
}

export async function markTaskApproved(taskId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'approved' })
    .eq('id', taskId);
  if (error) throw error;
}

export async function getAllTasksForAdmin(workspaceId, filters = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('tasks')
    .select(`
      id, title, description, status, deadline, created_at,
      assigned_to:users!assigned_to(username, telegram_id),
      created_by:users!created_by(username)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (filters.status) {
    if (filters.status === 'active') {
      query = query.in('status', ['assigned', 'in_progress']);
    } else if (filters.status === 'overdue') {
      query = query.in('status', ['assigned', 'in_progress'])
        .lt('deadline', new Date().toISOString());
    } else if (filters.status === 'pending_review') {
      query = query.eq('status', 'pending_review');
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  const { data: tasks, error } = await query;
  if (error) throw error;
  
  return tasks || [];
}

export async function getTaskDetails(taskId) {
  const supabase = getClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      id, title, description, status, deadline, created_at,
      assigned_to:users!assigned_to(username, telegram_id),
      created_by:users!created_by(username)
    `)
    .eq('id', taskId)
    .single();
  
  if (error) throw error;
  return task;
}
