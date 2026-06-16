import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";
import { ChevronRight, HardHat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const sessao = await getSessao();

  const { data: obras } = await supabaseAdmin
    .from("obras")
    .select("id, nome, descricao")
    .order("criado_em", { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-1">Obras</h1>
      <p className="text-sm text-gray-500 mb-5">
        Selecione a obra para fazer os registros fotográficos.
      </p>

      {!obras || obras.length === 0 ? (
        <div className="text-center text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl py-10">
          Nenhuma obra cadastrada ainda.
          {sessao?.isAdmin && (
            <>
              {" "}
              <Link href="/admin" className="text-[var(--tce-azul)] underline">
                Cadastre uma no Admin.
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {obras.map((obra) => (
            <li key={obra.id}>
              <Link
                href={`/obras/${obra.id}`}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 hover:border-[var(--tce-azul)] hover:shadow-sm transition"
              >
                <span className="shrink-0 w-10 h-10 rounded-lg bg-[var(--tce-azul)]/10 flex items-center justify-center text-[var(--tce-azul)]">
                  <HardHat size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900 truncate">
                    {obra.nome}
                  </span>
                  {obra.descricao && (
                    <span className="block text-xs text-gray-500 truncate">
                      {obra.descricao}
                    </span>
                  )}
                </span>
                <ChevronRight size={18} className="ml-auto text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
