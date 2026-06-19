"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Servico } from "@/components/mural-servicos";

type Props = {
  servicos: Servico[];
  atualId: string | null;
  onSelecionar: (servicoId: string | null) => void;
  onFechar: () => void;
};

// Modal de busca para vincular uma foto a um serviço do mural.
export function ServicoPicker({ servicos, atualId, onSelecionar, onFechar }: Props) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q
      ? servicos.filter(
          (s) => s.item.includes(q) || s.descricao.toLowerCase().includes(q)
        )
      : servicos;
    return base.slice(0, 200);
  }, [busca, servicos]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900 flex-1">Vincular a serviço</span>
          <button
            type="button"
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por item (ex.: 1.1) ou descrição..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
            />
          </div>
        </div>

        <ul className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {atualId && (
            <li>
              <button
                type="button"
                onClick={() => onSelecionar(null)}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                Remover vínculo
              </button>
            </li>
          )}
          {filtrados.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelecionar(s.id)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2 hover:bg-gray-50 ${
                  s.id === atualId ? "bg-[var(--tce-azul)]/5" : ""
                }`}
              >
                <span className="shrink-0 font-mono text-xs text-[var(--tce-azul)] pt-0.5">
                  {s.item}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-gray-800 leading-snug">{s.descricao}</span>
                  {(s.unidade || s.quantidade != null) && (
                    <span className="block text-xs text-gray-400">
                      {s.quantidade != null ? s.quantidade : ""}
                      {s.unidade ? ` ${s.unidade}` : ""}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
          {filtrados.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              Nenhum serviço encontrado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
