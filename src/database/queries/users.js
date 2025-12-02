import { getClient } from '../supabase.js';

export async function upsertUserByTelegram(telegramId, username) {
  const supabase = getClient();
  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', String(telegramId))
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('users')
    .insert({ telegram_id: String(telegramId), username })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function listUsersByWorkspace(workspaceId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, username, total_xp')
    .eq('workspace_id', workspaceId)
    .order('username', { ascending: true });
  if (error) throw error;
  return data;
}

export async function setUserWorkspace(userId, workspaceId) {
  const supabase = getClient();
  const { error } = await supabase
    .from('users')
    .update({ workspace_id: workspaceId })
    .eq('id', userId);
  if (error) throw error;
}









