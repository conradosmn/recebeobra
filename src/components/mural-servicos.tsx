"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  ListTree,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { extrairServicos } from "@/lib/planilha";
import { importarServicos, limparServicos } from "@/actions/servicos";
import { ServicoFotoModal } from "@/components/servico-foto-modal";

export type Servico = {
  id: string;
  item: string;
  descricao: string;
  unidade: string | null;
  quantidade: number | null;
};

type RegistroMin = {
  id: string;
  descricao: string;
  foto_data: string;
  servico_id: string | null;
};

type Props = {
  obraId: string;
  isAdmin: boolean;
  servicos: Servico[];
  registros: RegistroMin[];
};

function itemPai(item: string): string {
  return item.split(".").slice(0, -1).join(".");
}

const fmtQtd = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function MuralServicos({ obraId, isAdmin, servicos, registros }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  // Serviço (folha) cujo painel de vincular foto está aberto.
  const [vinculando, setVinculando] = useState<Servico | null>(null);

  // Quantas fotos estão vinculadas a cada serviço.
  const contagemPorServico = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of registros) {
      if (r.servico_id) m.set(r.servico_id, (m.get(r.servico_id) ?? 0) + 1);
    }
    return m;
  }, [registros]);

  // Monta a árvore em cascata a partir da lista achatada (ordenada por `ordem`).
  const { filhosDe, raizes } = useMemo(() => {
    const existe = new Set(servicos.map((s) => s.item));
    const filhosDe = new Map<string, Servico[]>();
    for (const s of servicos) {
      const pai = itemPai(s.item);
      const chave = pai && existe.has(pai) ? pai : "";
      const lista = filhosDe.get(chave) ?? [];
      lista.push(s);
      filhosDe.set(chave, lista);
    }
    return { filhosDe, raizes: filhosDe.get("") ?? [] };
  }, [servicos]);

  function alternar(item: string) {
    setExpandido((prev) => {
      const novo = new Set(prev);
      if (novo.has(item)) novo.delete(item);
      else novo.add(item);
      return novo;
    });
  }

  function expandirTudo() {
    setExpandido(new Set(servicos.filter((s) => filhosDe.has(s.item)).map((s) => s.item)));
  }

  async function aoSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setMsg(null);
    setImportando(true);
    try {
      const itens = await extrairServicos(file);
      if (itens.length === 0) {
        setErro("Não encontrei itens na planilha (preciso das colunas ITEM e DESCRIÇÃO).");
        return;
      }
      const r = await importarServicos(obraId, itens);
      if (r.erro) setErro(r.erro);
      else {
        setMsg(`${r.total} serviços importados.`);
        router.refresh();
      }
    } catch {
      setErro("Não foi possível ler a planilha. Use um arquivo .xlsx, .xls ou .csv.");
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function aoLimpar() {
    if (!confirm("Remover todos os serviços do mural desta obra?")) return;
    setImportando(true);
    setErro(null);
    setMsg(null);
    const r = await limparServicos(obraId);
    if (r.erro) setErro(r.erro);
    else router.refresh();
    setImportando(false);
  }

  function No({ s }: { s: Servico }) {
    const filhos = filhosDe.get(s.item) ?? [];
    const tem = filhos.length > 0;
    const exp = expandido.has(s.item);
    const nivel = s.item.split(".").length;

    return (
      <li>
        <div
          className="flex items-start gap-2 py-1.5 border-b border-gray-100"
          style={{ paddingLeft: `${(nivel - 1) * 16}px` }}
        >
          {tem ? (
            <button
              type="button"
              onClick={() => alternar(s.item)}
              className="shrink-0 mt-0.5 text-gray-400 hover:text-[var(--tce-azul)]"
              aria-label={exp ? "Recolher" : "Expandir"}
            >
              {exp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="shrink-0 mt-2 ml-1 w-1 h-1 rounded-full bg-gray-300" />
          )}

          <span className="shrink-0 font-mono text-xs text-[var(--tce-azul)] tabular-nums pt-0.5">
            {s.item}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block text-sm leading-snug ${
                tem ? "font-semibold text-gray-800" : "text-gray-700"
              }`}
            >
              {s.descricao}
            </span>
            {(s.unidade || s.quantidade != null) && (
              <span className="block text-xs text-gray-400">
                {s.quantidade != null ? fmtQtd.format(s.quantidade) : ""}
                {s.unidade ? ` ${s.unidade}` : ""}
              </span>
            )}
          </span>

          {!tem &&
            (() => {
              const n = contagemPorServico.get(s.id) ?? 0;
              return (
                <button
                  type="button"
                  onClick={() => setVinculando(s)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                    n > 0
                      ? "bg-[var(--tce-azul)]/10 text-[var(--tce-azul)]"
                      : "border border-gray-200 text-gray-400 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)]"
                  }`}
                  title="Vincular foto a este serviço"
                >
                  <Camera size={14} />
                  {n > 0 && <span className="font-semibold">{n}</span>}
                </button>
              );
            })()}
        </div>

        {tem && exp && (
          <ul>
            {filhos.map((f) => (
              <No key={f.id} s={f} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <ListTree size={18} className="text-[var(--tce-azul)] shrink-0" />
        <span className="font-semibold text-gray-900 flex-1">Mural de Serviços</span>
        <span className="text-xs text-gray-500">{servicos.length}</span>
        {aberto ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>

      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {isAdmin && (
            <div className="pt-3 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={aoSelecionarArquivo}
                className="hidden"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={importando}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white text-sm font-semibold px-3 py-2 disabled:opacity-60"
                >
                  {importando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {servicos.length > 0 ? "Substituir planilha" : "Importar planilha"}
                </button>
                {servicos.length > 0 && (
                  <button
                    type="button"
                    disabled={importando}
                    onClick={aoLimpar}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-600 text-sm px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Trash2 size={16} /> Limpar
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Planilha orçamentária (.xlsx/.xls/.csv) com colunas ITEM, DESCRIÇÃO, UNID e QUANT.
              </p>
            </div>
          )}

          {erro && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}
          {msg && (
            <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {msg}
            </p>
          )}

          {servicos.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              {isAdmin
                ? "Nenhum serviço ainda. Importe a planilha orçamentária da obra."
                : "O mural de serviços ainda não foi configurado para esta obra."}
            </p>
          ) : (
            <>
              <div className="flex gap-3 pt-3 pb-1">
                <button
                  type="button"
                  onClick={expandirTudo}
                  className="text-xs text-[var(--tce-azul)] underline"
                >
                  Expandir tudo
                </button>
                <button
                  type="button"
                  onClick={() => setExpandido(new Set())}
                  className="text-xs text-[var(--tce-azul)] underline"
                >
                  Recolher tudo
                </button>
              </div>
              <ul className="max-h-[28rem] overflow-y-auto -mx-1 px-1">
                {raizes.map((s) => (
                  <No key={s.id} s={s} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {vinculando && (
        <ServicoFotoModal
          obraId={obraId}
          servico={vinculando}
          registros={registros}
          onFechar={() => setVinculando(null)}
        />
      )}
    </div>
  );
}
