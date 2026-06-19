import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { RegistrosObra } from "@/components/registros-obra";
import { MuralServicos } from "@/components/mural-servicos";

export const dynamic = "force-dynamic";

export default async function ObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) return null;

  const { data: obra } = await supabaseAdmin
    .from("obras")
    .select("id, nome, descricao")
    .eq("id", id)
    .maybeSingle();

  if (!obra) notFound();

  const { data: registros } = await supabaseAdmin
    .from("registros")
    .select("id, descricao, foto_data, criado_em, servico_id")
    .eq("obra_id", id)
    .eq("autor_email", sessao.email)
    .order("criado_em", { ascending: true });

  const { data: servicos } = await supabaseAdmin
    .from("servicos")
    .select("id, item, descricao, unidade, quantidade")
    .eq("obra_id", id)
    .order("ordem", { ascending: true });

  return (
    <div>
      <Link
        href="/obras"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--tce-azul)] mb-4"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="text-lg font-bold text-gray-900">{obra.nome}</h1>
      {obra.descricao && (
        <p className="text-sm text-gray-500 mb-5">{obra.descricao}</p>
      )}

      <div className="space-y-6">
        <MuralServicos
          obraId={obra.id}
          isAdmin={sessao.isAdmin}
          servicos={servicos ?? []}
          registros={registros ?? []}
        />

        <RegistrosObra
          obra={{ id: obra.id, nome: obra.nome }}
          autor={sessao.email}
          inicial={registros ?? []}
          servicos={servicos ?? []}
        />
      </div>
    </div>
  );
}
