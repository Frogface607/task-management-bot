import { getClient } from '../supabase.js';

function generateInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function createWorkspace(name, timezone = 'Asia/Irkutsk') {
  const supabase = getClient();
  let inviteCode = generateInviteCode();
  // Ensure unique invite code
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from('workspaces').select('id').eq('invite_code', inviteCode).maybeSingle();
    if (!existing) break;
    inviteCode = generateInviteCode();
  }
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ name, invite_code: inviteCode, timezone })
    .select('id, name, invite_code, timezone')
    .single();
  if (error) throw error;
  return data;
}

export async function getByInviteCode(code) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, invite_code, timezone')
    .eq('invite_code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
}



