import "server-only"
import { createClient } from "@supabase/supabase-js"

// Chave service_role: ignora as regras do banco. Use só no servidor
// e sempre depois de verificar quem está chamando.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
