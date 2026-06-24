"use client";

import { useState } from "react";
import { FileDown, Loader2, Users } from "lucide-react";
import { listarRegistrosTodosUsuarios } from "@/actions/relatorio";
import { gerarPdfGeral } from "@/lib/pdf";

export function RelatorioGeral({
  obraId,
  obraNome,
}: {
  obraId: string;
  obraNome: string;
}) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const r = await listarRegistrosTodosUsuarios(obraId);
      if (r.erro || !r.secoes) {
        setErro(r.erro ?? "Não foi possível gerar o relatório.");
        return;
      }
      await gerarPdfGeral({ obra: obraNome, secoes: r.secoes });
    } catch {
      setErro("Falha ao gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="bg-[var(--tce-azul)]/5 border border-[var(--tce-azul)]/20 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={18} className="text-[var(--tce-azul)] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Relatório geral (admin)</p>
            <p className="text-xs text-gray-500">
              PDF com o registro fotográfico de todos os usuários nesta obra.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={gerar}
          disabled={gerando}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold px-3 py-2 text-sm transition disabled:opacity-60"
        >
          {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          Gerar PDF
        </button>
      </div>
      {erro && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}
    </div>
  );
}
