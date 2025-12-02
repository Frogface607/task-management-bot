import { getClient } from '../supabase.js';

export async function createPersonalTask(workspaceId, creatorId, assignedTo, title, description, deadline) {
  const supabase = getClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ 
      title, 
      description, 
      assigned_to: assignedTo, 
      deadline, 
      status: 'assigned', 
      created_by: creatorId, 
      workspace_id: workspaceId 
    })
    .select('id')
    .single();
  if (error) throw error;
  return task.id;
}
