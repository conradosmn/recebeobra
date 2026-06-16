"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
import { LogoTce } from "@/components/logo-tce";

const estadoInicial: EstadoLogin = {};

export default function LoginPage() {
  const [estado, formAction, pendente] = useActionState(entrar, estadoInicial);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center text-center">
          <LogoTce className="w-36 h-auto mb-6" />
          <h1 className="text-xl font-bold text-[var(--tce-azul)] leading-snug">
            Recebimento Provisório
          </h1>
          <p className="text-sm font-medium text-gray-500 mb-6">Anexo III</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email cadastrado
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="seu.email@tce.pi.gov.br"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tce-azul)] focus:border-transparent"
            />
          </div>

          {estado.erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {estado.erro}
            </p>
          )}

          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-lg bg-[var(--tce-azul)] hover:bg-[var(--tce-azul-escuro)] text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
          >
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Acesso restrito aos emails autorizados.
        </p>
      </div>
    </main>
  );
}
