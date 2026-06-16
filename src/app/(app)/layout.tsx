import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { sair } from "@/actions/sessao";
import { LogoTce } from "@/components/logo-tce";
import { LogOut, ShieldCheck } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/obras" className="flex items-center gap-3 min-w-0">
            <LogoTce className="h-10 w-auto" />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold text-[var(--tce-azul)] truncate">
                Recebimento Provisório
              </p>
              <p className="text-xs text-gray-500">Anexo III</p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {sessao.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 text-xs font-medium text-[var(--tce-azul)] hover:underline"
              >
                <ShieldCheck size={15} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[180px]">
              {sessao.email}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
