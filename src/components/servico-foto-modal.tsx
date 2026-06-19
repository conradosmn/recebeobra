"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImageIcon, Loader2, Plus, X } from "lucide-react";
import { comprimir } from "@/lib/imagem";
import { adicionarRegistro } from "@/actions/registros";
import { vincularRegistroServico } from "@/actions/servicos";
import type { Servico } from "@/components/mural-servicos";

type RegistroMin = {
  id: string;
  descricao: string;
  foto_data: string;
  servico_id: string | null;
};

type Props = {
  obraId: string;
  servico: Servico;
  registros: RegistroMin[];
  onFechar: () => void;
};

// Painel para vincular uma foto a um serviço do mural: tirar/subir uma nova
// (já vinculada) ou escolher entre as fotos já tiradas.
export function ServicoFotoModal({ obraId, servico, registros, onFechar }: Props) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [aba, setAba] = useState<"nova" | "existentes">("nova");
  const [foto, setFoto] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  async function aoSelecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    try {
      setFoto(await comprimir(file));
    } catch {
      setErro("Não foi possível processar a foto.");
    } finally {
      if (cameraRef.current) cameraRef.current.value = "";
      if (galeriaRef.current) galeriaRef.current.value = "";
    }
  }

  function salvarNova() {
    if (!foto) return setErro("Tire ou selecione uma foto.");
    if (!descricao.trim()) return setErro("Descreva a foto.");
    setErro(null);
    iniciar(async () => {
      const r = await adicionarRegistro(obraId, descricao, foto, servico.id);
      if (r.erro) return setErro(r.erro);
      router.refresh();
      onFechar();
    });
  }

  function vincularExistente(registroId: string) {
    setErro(null);
    iniciar(async () => {
      const r = await vincularRegistroServico(registroId, servico.id, obraId);
      if (r.erro) return setErro(r.erro);
      router.refresh();
      onFechar();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col shadow-xl">
        <div className="flex items-start gap-2 p-4 border-b border-gray-200">
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-gray-500">Vincular foto ao serviço</span>
            <span className="block text-sm font-semibold text-gray-900">
              <span className="font-mono text-[var(--tce-azul)]">{servico.item}</span>{" "}
              {servico.descricao}
            </span>
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="shrink-0 text-gray-400 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200 text-sm">
          <button
            type="button"
            onClick={() => setAba("nova")}
            className={`flex-1 py-2.5 font-medium ${
              aba === "nova"
                ? "text-[var(--tce-azul)] border-b-2 border-[var(--tce-azul)]"
                : "text-gray-500"
            }`}
          >
            Nova foto
          </button>
          <button
            type="button"
            onClick={() => setAba("existentes")}
            className={`flex-1 py-2.5 font-medium ${
              aba === "existentes"
                ? "text-[var(--tce-azul)] border-b-2 border-[var(--tce-azul)]"
                : "text-gray-500"
            }`}
          >
            Fotos já tiradas ({registros.length})
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {erro && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          {aba === "nova" ? (
            <div className="space-y-3">
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={aoSelecionarFoto}
                className="hidden"
              />
              <input
                ref={galeriaRef}
                type="file"
                accept="image/*"
                onChange={aoSelecionarFoto}
                className="hidden"
              />

              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt="Pré-visualização"
                  className="w-full rounded-lg border border-gray-200 max-h-60 object-contain bg-gray-50"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)] transition"
                  >
                    <Camera size={26} />
                    <span className="text-sm font-medium">Tirar foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galeriaRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)] transition"
                  >
                    <ImageIcon size={26} />
                    <span className="text-sm font-medium">Galeria</span>
                  </button>
                </div>
              )}

              {foto && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="text-xs text-[var(--tce-azul)] underline"
                  >
                    Tirar outra
                  </button>
                  <button
                    type="button"
                    onClick={() => galeriaRef.current?.click()}
                    className="text-xs text-[var(--tce-azul)] underline"
                  >
                    Escolher da galeria
                  </button>
                </div>
              )}

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
              />

              <button
                type="button"
                onClick={salvarNova}
                disabled={salvando}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
              >
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {salvando ? "Salvando..." : "Salvar foto vinculada"}
              </button>
            </div>
          ) : registros.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Você ainda não tem fotos nesta obra.
            </p>
          ) : (
            <ul className="space-y-2">
              {registros.map((r) => {
                const jaNeste = r.servico_id === servico.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      disabled={salvando || jaNeste}
                      onClick={() => vincularExistente(r.id)}
                      className={`w-full flex items-center gap-3 text-left rounded-lg border p-2 ${
                        jaNeste
                          ? "border-[var(--tce-azul)] bg-[var(--tce-azul)]/5"
                          : "border-gray-200 hover:border-[var(--tce-azul)]"
                      } disabled:cursor-default`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.foto_data}
                        alt={r.descricao}
                        className="shrink-0 w-16 h-16 rounded-md object-cover bg-gray-50 border border-gray-100"
                      />
                      <span className="min-w-0 flex-1 text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap">
                        {r.descricao}
                      </span>
                      {jaNeste && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--tce-azul)] font-medium">
                          <Check size={16} /> Vinculada
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
