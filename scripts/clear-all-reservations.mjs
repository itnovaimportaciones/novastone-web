import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { error } = await supabase.rpc('clear_all_reservations');

if (error) {
  console.error('RPC error:', error);
  process.exit(1);
}

console.log('OK: se borraron TODAS las reservas activas y se restockeo inventario');
