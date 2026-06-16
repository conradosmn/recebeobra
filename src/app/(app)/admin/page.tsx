import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";
import { PainelAdmin } from "@/components/painel-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!sessao.isAdmin) redirect("/obras");

  const [{ data: usuarios }, { data: obras }] = await Promise.all([
    supabaseAdmin
      .from("usuarios_permitidos")
      .select("email, nome, is_admin")
      .order("criado_em", { ascending: true }),
    supabaseAdmin
      .from("obras")
      .select("id, nome, descricao")
      .order("criado_em", { ascending: false }),
  ]);

  return (
    <PainelAdmin usuarios={usuarios ?? []} obras={obras ?? []} />
  );
}
