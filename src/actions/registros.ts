"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function adicionarRegistro(
  obraId: string,
  descricao: string,
  fotoData: string,
  servicoId?: string | null
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
    servico_id: servicoId ?? null,
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

// Edita a descrição de um registro do próprio autor.
export async function editarDescricaoRegistro(
  registroId: string,
  descricao: string,
  obraId: string
): Promise<{ erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const desc = descricao.trim();
  if (!desc) return { erro: "A descrição não pode ficar vazia." };

  const { error } = await supabaseAdmin
    .from("registros")
    .update({ descricao: desc })
    .eq("id", registroId)
    .eq("autor_email", sessao.email);

  if (error) return { erro: "Não foi possível salvar a descrição." };

  revalidatePath(`/obras/${obraId}`);
  return {};
}

// Apaga todos os registros da obra do próprio autor de uma vez.
export async function excluirTodosRegistros(
  obraId: string
): Promise<{ erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const { error } = await supabaseAdmin
    .from("registros")
    .delete()
    .eq("obra_id", obraId)
    .eq("autor_email", sessao.email);

  if (error) return { erro: "Não foi possível excluir os registros." };

  revalidatePath(`/obras/${obraId}`);
  return {};
}
