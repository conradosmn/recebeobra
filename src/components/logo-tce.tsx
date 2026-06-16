/* eslint-disable @next/next/no-img-element */

// Logo oficial vertical do TCE-PI. Salve o arquivo em public/logo-tce.png
// (ou .svg e ajuste o src abaixo).
export function LogoTce({ className }: { className?: string }) {
  return (
    <img
      src="/logo-tce.png"
      alt="Tribunal de Contas do Estado do Piauí"
      className={className}
    />
  );
}
