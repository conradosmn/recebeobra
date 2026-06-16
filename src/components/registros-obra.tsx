"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileDown, Loader2, Plus, Trash2 } from "lucide-react";
import { adicionarRegistro, excluirRegistro } from "@/actions/registros";
import { gerarPdf } from "@/lib/pdf";

type Registro = {
  id: string;
  descricao: string;
  foto_data: string;
  criado_em: string;
};

type Props = {
  obra: { id: string; nome: string };
  autor: string;
  inicial: Registro[];
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

export function RegistrosObra({ obra, autor, inicial }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciarSalvar] = useTransition();
  const [gerando, setGerando] = useState(false);

  async function aoSelecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    try {
      setFoto(await comprimir(file));
    } catch {
      setErro("Não foi possível processar a foto.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
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

  async function baixarPdf() {
    setGerando(true);
    setErro(null);
    try {
      await gerarPdf({ obra: obra.nome, autor, registros: inicial });
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
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 text-gray-500 hover:border-[var(--tce-azul)] hover:text-[var(--tce-azul)] transition"
          >
            <Camera size={28} />
            <span className="text-sm font-medium">Tirar foto</span>
          </button>
        )}

        {foto && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-[var(--tce-azul)] underline"
          >
            Trocar foto
          </button>
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
