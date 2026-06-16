"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function adicionarRegistro(
  obraId: string,
  descricao: string,
  fotoData: string
): Promise<{ erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const desc = descricao.trim();
  if (!desc) return { erro: "Descreva a foto." };
  if (!fotoData.startsWith("data:image/")) return { erro: "Foto inválida." };

  const { error } = await supabaseAdmin.from("registros").insert({
    obra_id: obraId,
    autor_email: sessao.email,
    descricao: desc,
    foto_data: fotoData,
  });

  if (error) return { erro: "Não foi possível salvar o registro." };

  revalidatePath(`/obras/${obraId}`);
  return {};
}

export async function excluirRegistro(
  registroId: string,
  obraId: string
): Promise<{ erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  // Só apaga registro do próprio autor.
  const { error } = await supabaseAdmin
    .from("registros")
    .delete()
    .eq("id", registroId)
    .eq("autor_email", sessao.email);

  if (error) return { erro: "Não foi possível excluir." };

  revalidatePath(`/obras/${obraId}`);
  return {};
}
