import { getClient } from '../supabase.js';

export async function createTaskTemplate(workspaceId, name, title, description, defaultDeadlineHours = 24) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      workspace_id: workspaceId,
      name,
      title,
      description,
      default_deadline_hours: defaultDeadlineHours
    })
    .select('id, name, title, description, default_deadline_hours')
    .single();
  
  if (error) throw error;
  return data;
}

export async function getTaskTemplates(workspaceId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('task_templates')
    .select('id, name, title, description, default_deadline_hours')
    .eq('workspace_id', workspaceId)
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function deleteTaskTemplate(templateId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', templateId);
  
  if (error) throw error;
}

export async function getTaskTemplate(templateId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('task_templates')
    .select('id, name, title, description, default_deadline_hours, workspace_id')
    .eq('id', templateId)
    .single();
  
  if (error) throw error;
  return data;
}

