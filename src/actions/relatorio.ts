"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export type RegistroRelatorio = {
  descricao: string;
  foto_data: string;
  criado_em: string;
  servico: string | null;
};

export type SecaoRelatorio = {
  autor: string;
  registros: RegistroRelatorio[];
};

// Monta o relatório fotográfico de uma obra com os registros de TODOS os
// usuários, agrupados por autor. Acesso restrito ao admin.
export async function listarRegistrosTodosUsuarios(
  obraId: string
): Promise<{ erro?: string; secoes?: SecaoRelatorio[] }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada." };
  if (!sessao.isAdmin) return { erro: "Acesso restrito ao administrador." };

  const [{ data: registros, error }, { data: servicos }, { data: usuarios }] =
    await Promise.all([
      supabaseAdmin
        .from("registros")
        .select("descricao, foto_data, criado_em, autor_email, servico_id")
        .eq("obra_id", obraId)
        .order("autor_email", { ascending: true })
        .order("criado_em", { ascending: true }),
      supabaseAdmin.from("servicos").select("id, item, descricao").eq("obra_id", obraId),
      supabaseAdmin.from("usuarios_permitidos").select("email, nome"),
    ]);

  if (error) return { erro: "Não foi possível carregar os registros." };
  if (!registros || registros.length === 0) {
    return { erro: "Nenhum registro encontrado para esta obra." };
  }

  const servicoPorId = new Map((servicos ?? []).map((s) => [s.id, s]));
  const nomePorEmail = new Map((usuarios ?? []).map((u) => [u.email, u.nome]));

  const secoesPorAutor = new Map<string, SecaoRelatorio>();
  for (const r of registros) {
    const nome = nomePorEmail.get(r.autor_email);
    const autor = nome ? `${nome} (${r.autor_email})` : r.autor_email;
    if (!secoesPorAutor.has(autor)) secoesPorAutor.set(autor, { autor, registros: [] });

    const s = r.servico_id ? servicoPorId.get(r.servico_id) : null;
    secoesPorAutor.get(autor)!.registros.push({
      descricao: r.descricao,
      foto_data: r.foto_data,
      criado_em: r.criado_em,
      servico: s ? `${s.item} - ${s.descricao}` : null,
    });
  }

  return { secoes: Array.from(secoesPorAutor.values()) };
}
