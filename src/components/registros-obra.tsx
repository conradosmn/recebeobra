"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileDown, ImageIcon, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  adicionarRegistro,
  excluirRegistro,
  excluirTodosRegistros,
} from "@/actions/registros";
import { vincularRegistroServico } from "@/actions/servicos";
import { gerarPdf } from "@/lib/pdf";
import type { Servico } from "@/components/mural-servicos";
import { ServicoPicker } from "@/components/servico-picker";

type Registro = {
  id: string;
  descricao: string;
  foto_data: string;
  criado_em: string;
  servico_id: string | null;
};

type Props = {
  obra: { id: string; nome: string };
  autor: string;
  inicial: Registro[];
  servicos: Servico[];
};

// Redimensiona/comprime a foto da câmera para um JPEG leve (dataURL).
function comprimir(file: File, maxLado = 1280, qualidade = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLado) {
          height = Math.round((height * maxLado) / width);
          width = maxLado;
        } else if (height >= width && height > maxLado) {
          width = Math.round((width * maxLado) / height);
          height = maxLado;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RegistrosObra({ obra, autor, inicial, servicos }: Props) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciarSalvar] = useTransition();
  const [gerando, setGerando] = useState(false);
  // Id do registro cujo seletor de serviço está aberto.
  const [vinculando, setVinculando] = useState<string | null>(null);

  const servicoPorId = new Map(servicos.map((s) => [s.id, s]));

  function aoVincular(registroId: string, servicoId: string | null) {
    setVinculando(null);
    iniciarSalvar(async () => {
      const r = await vincularRegistroServico(registroId, servicoId, obra.id);
      if (r.erro) return setErro(r.erro);
      router.refresh();
    });
  }

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

  function adicionar() {
    if (!foto) return setErro("Tire ou selecione uma foto.");
    if (!descricao.trim()) return setErro("Descreva a foto.");
    setErro(null);
    iniciarSalvar(async () => {
      const r = await adicionarRegistro(obra.id, descricao, foto);
      if (r.erro) return setErro(r.erro);
      setFoto(null);
      setDescricao("");
      router.refresh();
    });
  }

  function remover(id: string) {
    if (!confirm("Excluir este registro?")) return;
    iniciarSalvar(async () => {
      const r = await excluirRegistro(id, obra.id);
      if (r.erro) return setErro(r.erro);
      router.refresh();
    });
  }

  function removerTodas() {
    if (
      !confirm(
        `Apagar TODOS os ${inicial.length} registros desta obra? Esta ação não pode ser desfeita.`
      )
    )
      return;
    iniciarSalvar(async () => {
      const r = await excluirTodosRegistros(obra.id);
      if (r.erro) return setErro(r.erro);
      router.refresh();
    });
  }

  async function baixarPdf() {
    setGerando(true);
    setErro(null);
    try {
      const registros = inicial.map((r) => {
        const s = r.servico_id ? servicoPorId.get(r.servico_id) : null;
        return {
          descricao: r.descricao,
          foto_data: r.foto_data,
          criado_em: r.criado_em,
          servico: s ? `${s.item} - ${s.descricao}` : null,
        };
      });
      await gerarPdf({ obra: obra.nome, autor, registros });
    } catch {
      setErro("Falha ao gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Captura */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
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
            className="w-full rounded-lg border border-gray-200 max-h-72 object-contain bg-gray-50"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)] transition"
            >
              <Camera size={28} />
              <span className="text-sm font-medium">Tirar foto</span>
            </button>
            <button
              type="button"
              onClick={() => galeriaRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)] transition"
            >
              <ImageIcon size={28} />
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
              Tirar outra foto
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
          placeholder="Descrição da foto (ex.: fachada principal, fissura na laje do 2º pavimento...)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
        />

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={adicionar}
          disabled={salvando}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {salvando ? "Salvando..." : "Adicionar registro"}
        </button>
      </div>

      {/* Lista de registros */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Meus registros ({inicial.length})
          </h2>
          <div className="flex items-center gap-2">
            {inicial.length > 0 && (
              <button
                type="button"
                onClick={removerTodas}
                disabled={salvando}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-semibold px-3 py-2 text-sm transition disabled:opacity-40"
              >
                <Trash2 size={16} />
                Apagar Registros
              </button>
            )}
            <button
              type="button"
              onClick={baixarPdf}
              disabled={gerando || inicial.length === 0}
              className="flex items-center gap-2 rounded-lg border border-[var(--tce-azul)] text-[var(--tce-azul)] hover:bg-[var(--tce-azul)] hover:text-white font-semibold px-3 py-2 text-sm transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--tce-azul)]"
            >
              {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              Gerar PDF
            </button>
          </div>
        </div>

        {inicial.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl py-8 text-center">
            Nenhum registro ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {inicial.map((r, i) => (
              <li
                key={r.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.foto_data}
                  alt={r.descricao}
                  className="w-full max-h-64 object-contain bg-gray-50"
                />
                <div className="p-3 flex items-start gap-2">
                  <span className="shrink-0 text-xs font-bold text-[var(--tce-azul)] bg-[var(--tce-azul)]/10 rounded px-2 py-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-800 flex-1 whitespace-pre-wrap">
                    {r.descricao}
                  </p>
                  <button
                    type="button"
                    onClick={() => remover(r.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {servicos.length > 0 && (
                  <div className="px-3 pb-3 -mt-1">
                    {(() => {
                      const s = r.servico_id ? servicoPorId.get(r.servico_id) : undefined;
                      if (!s) {
                        return (
                          <button
                            type="button"
                            onClick={() => setVinculando(r.id)}
                            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)]"
                          >
                            <Link2 size={14} className="shrink-0" />
                            <span>Vincular a serviço</span>
                          </button>
                        );
                      }
                      return (
                        <div className="flex items-start gap-1.5 text-xs rounded-lg bg-[var(--tce-azul)]/10 text-[var(--tce-azul)] pl-2 pr-1 py-1.5">
                          <Link2 size={14} className="shrink-0 mt-0.5" />
                          <button
                            type="button"
                            onClick={() => setVinculando(r.id)}
                            className="text-left min-w-0 flex-1 hover:underline"
                            title="Trocar serviço"
                          >
                            <span className="font-mono font-semibold">{s.item}</span>{" "}
                            <span className="line-clamp-1">{s.descricao}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVinculando(r.id)}
                            className="shrink-0 underline whitespace-nowrap px-1"
                            title="Trocar serviço"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => aoVincular(r.id, null)}
                            className="shrink-0 text-[var(--tce-azul)]/70 hover:text-red-600"
                            aria-label="Remover vínculo"
                            title="Remover vínculo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {vinculando && (
        <ServicoPicker
          servicos={servicos}
          atualId={inicial.find((r) => r.id === vinculando)?.servico_id ?? null}
          onSelecionar={(servicoId) => aoVincular(vinculando, servicoId)}
          onFechar={() => setVinculando(null)}
        />
      )}
    </div>
  );
}
