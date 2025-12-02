import { getClient } from '../supabase.js';

export async function createIssue(userId, category, description, photoUrl = null, workspaceId = null) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('issues')
    .insert({ reported_by: userId, category, description, photo_url: photoUrl, status: 'new', workspace_id: workspaceId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function listIssues(workspaceId, statuses = ['new','in_progress','resolved']) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('issues')
    .select('id, category, description, photo_url, status, reported_by, created_at')
    .in('status', statuses)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Filter by workspace through reporter
  const { data: users } = await supabase.from('users').select('id, workspace_id');
  const wsUserIds = new Set(users.filter(u => u.workspace_id === workspaceId).map(u => u.id));
  return (data || []).filter(i => wsUserIds.has(i.reported_by));
}

export async function setIssueStatus(issueId, status) {
  const supabase = getClient();
  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId);
  if (error) throw error;
}









