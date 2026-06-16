"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { criarSessao } from "@/lib/auth";

export type EstadoLogin = { erro?: string };

export async function entrar(
  _prev: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { erro: "Informe um email válido." };
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios_permitidos")
    .select("email, is_admin")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return { erro: "Erro ao verificar o email. Tente novamente." };
  }
  if (!data) {
    return { erro: "Email não autorizado. Fale com o administrador." };
  }

  await criarSessao(data.email, data.is_admin);
  redirect("/obras");
}
