import { getClient } from '../supabase.js';

export async function listRoles() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, access_level, xp_weight')
    .order('access_level', { ascending: false });
  if (error) throw error;
  return data;
}

export async function assignUserRole(userId, roleId) {
  const supabase = getClient();
  // Use upsert-like behavior: insert if not exists
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role_id: roleId }, { onConflict: 'user_id,role_id' });
  if (error) throw error;
}









