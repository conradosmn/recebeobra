"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";
import type { ServicoImport } from "@/lib/planilha";

async function exigirAdmin(): Promise<{ ok: boolean; erro?: string }> {
  const sessao = await getSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada." };
  if (!sessao.isAdmin) return { ok: false, erro: "Acesso restrito ao administrador." };
  return { ok: true };
}

// Importa (substitui) o mural de serviços de uma obra a partir da planilha já
// lida no navegador. Preserva os vínculos de fotos casando pelo código do item.
export async function importarServicos(
  obraId: string,
  servicos: ServicoImport[]
): Promise<{ erro?: string; ok?: boolean; total?: number }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  if (!Array.isArray(servicos) || servicos.length === 0) {
    return { erro: "Nenhum serviço encontrado na planilha." };
  }
  if (servicos.length > 5000) {
    return { erro: "Planilha muito grande (mais de 5000 itens)." };
  }

  // Guarda os vínculos atuais (registro -> item) antes de recriar o mural.
  const { data: antigos } = await supabaseAdmin
    .from("servicos")
    .select("id, item")
    .eq("obra_id", obraId);
  const idParaItem = new Map((antigos ?? []).map((s) => [s.id, s.item]));

  const { data: regsVinculados } = await supabaseAdmin
    .from("registros")
    .select("id, servico_id")
    .eq("obra_id", obraId)
    .not("servico_id", "is", null);

  // Recria o mural: apaga os serviços (zera servico_id das fotos via FK) e insere.
  const del = await supabaseAdmin.from("servicos").delete().eq("obra_id", obraId);
  if (del.error) return { erro: "Não foi possível limpar o mural anterior." };

  const linhas = servicos.map((s, i) => ({
    obra_id: obraId,
    item: String(s.item).trim(),
    descricao: String(s.descricao).trim(),
    unidade: s.unidade ? String(s.unidade).trim() : null,
    quantidade: typeof s.quantidade === "number" ? s.quantidade : null,
    ordem: i,
  }));

  const itemParaNovoId = new Map<string, string>();
  for (let i = 0; i < linhas.length; i += 500) {
    const lote = linhas.slice(i, i + 500);
    const { data, error } = await supabaseAdmin.from("servicos").insert(lote).select("id, item");
    if (error) return { erro: "Não foi possível salvar os serviços." };
    for (const r of data ?? []) itemParaNovoId.set(r.item, r.id);
  }

  // Restaura vínculos cujas fotos apontavam para um item que continua existindo.
  for (const reg of regsVinculados ?? []) {
    const item = idParaItem.get(reg.servico_id as string);
    const novoId = item ? itemParaNovoId.get(item) : undefined;
    if (novoId) {
      await supabaseAdmin.from("registros").update({ servico_id: novoId }).eq("id", reg.id);
    }
  }

  revalidatePath(`/obras/${obraId}`);
  return { ok: true, total: linhas.length };
}

export async function limparServicos(obraId: string): Promise<{ erro?: string; ok?: boolean }> {
  const guard = await exigirAdmin();
  if (!guard.ok) return { erro: guard.erro };

  const { error } = await supabaseAdmin.from("servicos").delete().eq("obra_id", obraId);
  if (error) return { erro: "Não foi possível limpar o mural." };

  revalidatePath(`/obras/${obraId}`);
  return { ok: true };
}

// Vincula/desvincula uma foto a um serviço. Só age sobre fotos do próprio autor.
export async function vincularRegistroServico(
  registroId: string,
  servicoId: string | null,
  obraId: string
): Promise<{ erro?: string; ok?: boolean }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const { error } = await supabaseAdmin
    .from("registros")
    .update({ servico_id: servicoId })
    .eq("id", registroId)
    .eq("autor_email", sessao.email);

  if (error) return { erro: "Não foi possível vincular o serviço." };

  revalidatePath(`/obras/${obraId}`);
  return { ok: true };
}
