import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente admin (service_role) — uso exclusivamente server-side.
// Todo acesso ao banco passa por aqui; o client nunca fala com o Supabase.
// Criado de forma preguiçosa para não quebrar o build quando as variáveis
// de ambiente ainda não estão presentes.
let _cliente: SupabaseClient | null = null;

function getCliente(): SupabaseClient {
  if (_cliente) return _cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local"
    );
  }

  _cliente = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cliente;
}

// Proxy para preservar a API `supabaseAdmin.from(...)` sem instanciar cedo.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const cliente = getCliente();
    const valor = cliente[prop as keyof SupabaseClient];
    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
