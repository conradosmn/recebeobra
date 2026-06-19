"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, HardHat, Loader2 } from "lucide-react";
import {
  adicionarEmail,
  removerEmail,
  adicionarObra,
  removerObra,
} from "@/actions/admin";

type Usuario = { email: string; nome: string | null; is_admin: boolean };
type Obra = { id: string; nome: string; descricao: string | null };

export function PainelAdmin({
  usuarios,
  obras,
}: {
  usuarios: Usuario[];
  obras: Obra[];
}) {
  const router = useRouter();
  const [estEmail, actEmail, loadEmail] = useActionState(adicionarEmail, {});
  const [estObra, actObra, loadObra] = useActionState(adicionarObra, {});

  // Atualiza a lista após sucesso de cada form.
  useEffect(() => {
    if (estEmail.ok) router.refresh();
  }, [estEmail, router]);
  useEffect(() => {
    if (estObra.ok) router.refresh();
  }, [estObra, router]);

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-bold text-gray-900">Administração</h1>

      {/* Emails autorizados */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-3">
          Emails autorizados
        </h2>

        <form
          action={actEmail}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="email"
              type="email"
              required
              placeholder="email@tce.pi.gov.br"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
            />
            <input
              name="nome"
              type="text"
              placeholder="Nome (opcional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input name="is_admin" type="checkbox" className="rounded" />
            Administrador
          </label>
          {estEmail.erro && (
            <p className="text-sm text-red-600">{estEmail.erro}</p>
          )}
          <button
            type="submit"
            disabled={loadEmail}
            className="flex items-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {loadEmail ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Adicionar email
          </button>
        </form>

        <ul className="space-y-2">
          {usuarios.map((u) => (
            <li
              key={u.email}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {u.email}
                  {u.is_admin && (
                    <span className="ml-2 text-[10px] font-bold text-[var(--tce-azul)] bg-[var(--tce-azul)]/10 rounded px-1.5 py-0.5 align-middle">
                      ADMIN
                    </span>
                  )}
                </p>
                {u.nome && <p className="text-xs text-gray-500 truncate">{u.nome}</p>}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Remover ${u.email}?`)) return;
                  const r = await removerEmail(u.email);
                  if (r.erro) alert(r.erro);
                  else router.refresh();
                }}
                className="ml-auto text-gray-400 hover:text-red-600"
                aria-label="Remover"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Obras */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Obras</h2>

        <form
          action={actObra}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4"
        >
          <input
            name="nome"
            type="text"
            required
            placeholder="Nome da obra"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
          />
          <input
            name="descricao"
            type="text"
            placeholder="Descrição / local (opcional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)]"
          />
          {estObra.erro && <p className="text-sm text-red-600">{estObra.erro}</p>}
          <button
            type="submit"
            disabled={loadObra}
            className="flex items-center gap-2 rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
          >
            {loadObra ? <Loader2 size={15} className="animate-spin" /> : <HardHat size={15} />}
            Criar obra
          </button>
        </form>

        <ul className="space-y-2">
          {obras.map((o) => (
            <li
              key={o.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{o.nome}</p>
                {o.descricao && (
                  <p className="text-xs text-gray-500 truncate">{o.descricao}</p>
                )}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Remover a obra "${o.nome}" e todos os seus registros?`)) return;
                  const r = await removerObra(o.id);
                  if (r.erro) alert(r.erro);
                  else router.refresh();
                }}
                className="ml-auto text-gray-400 hover:text-red-600"
                aria-label="Remover"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
