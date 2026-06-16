"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

async function exigirAdmin(): Promise<{ ok: boolean; erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada." };
  if (!sessao.isAdmin) return { ok: false, erro: "Acesso restrito ao administrador." };
  return { ok: true };
}

export async function adicionarEmail(
  _prev: { erro?: string; ok?: boolean },
  formData: FormData
): Promise<{ erro?: string; ok?: boolean }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const nome = String(formData.get("nome") || "").trim() || null;
  const isAdmin = formData.get("is_admin") === "on";

  if (!email || !email.includes("@")) return { erro: "Email inválido." };

  const { error } = await supabaseAdmin
    .from("usuarios_permitidos")
    .upsert({ email, nome, is_admin: isAdmin }, { onConflict: "email" });

  if (error) return { erro: "Não foi possível salvar o email." };

  revalidatePath("/admin");
  return { ok: true };
}

export async function removerEmail(email: string): Promise<{ erro?: string }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  // Protege o admin raiz contra remoção acidental.
  if (email === "conrado.machado@tce.pi.gov.br") {
    return { erro: "Não é possível remover o administrador principal." };
  }

  const { error } = await supabaseAdmin
    .from("usuarios_permitidos")
    .delete()
    .eq("email", email);

  if (error) return { erro: "Não foi possível remover." };

  revalidatePath("/admin");
  return {};
}

export async function adicionarObra(
  _prev: { erro?: string; ok?: boolean },
  formData: FormData
): Promise<{ erro?: string; ok?: boolean }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;

  if (!nome) return { erro: "Informe o nome da obra." };

  const { error } = await supabaseAdmin.from("obras").insert({ nome, descricao });
  if (error) return { erro: "Não foi possível criar a obra." };

  revalidatePath("/admin");
  revalidatePath("/obras");
  return { ok: true };
}

export async function removerObra(id: string): Promise<{ erro?: string }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  const { error } = await supabaseAdmin.from("obras").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover a obra." };

  revalidatePath("/admin");
  revalidatePath("/obras");
  return {};
}
