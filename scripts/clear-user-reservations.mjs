import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/clear-user-reservations.mjs email@ejemplo.com');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { error } = await supabase.rpc('clear_user_reservations', { p_email: email });

if (error) {
  console.error('RPC error:', error);
  process.exit(1);
}

console.log(`OK: reservas activas borradas y stock restockeado para ${email}`);
