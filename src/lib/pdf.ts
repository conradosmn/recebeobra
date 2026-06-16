import { jsPDF } from "jspdf";

type Registro = { descricao: string; foto_data: string; criado_em: string };

type Dados = {
  obra: string;
  autor: string;
  registros: Registro[];
};

type Img = { data: string; w: number; h: number };

function carregarImagem(src: string): Promise<Img | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ data: src, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function carregarLogo(): Promise<Img | null> {
  try {
    const res = await fetch("/logo-tce.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
    return await carregarImagem(dataUrl);
  } catch {
    return null;
  }
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function gerarPdf({ obra, autor, registros }: Dados): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;

  const logo = await carregarLogo();
  let y = margin;

  // --- Cabeçalho ---
  if (logo) {
    const w = 26;
    const h = (w * logo.h) / logo.w;
    doc.addImage(logo.data, "PNG", (pageW - w) / 2, y, w, h);
    y += h + 4;
  }
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(43, 58, 143);
  doc.text("Recebimento Provisório - Anexo III", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(40, 40, 40);
  doc.text(`Obra: ${obra}`, margin, y);
  y += 5;
  doc.text(`Responsável: ${autor}`, margin, y);
  y += 5;
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, margin, y);
  y += 4;
  doc.setDrawColor(210).line(margin, y, pageW - margin, y);
  y += 6;

  // --- Registros ---
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];
    const img = await carregarImagem(r.foto_data);

    let imgW = maxW;
    let imgH = 90;
    if (img) {
      imgH = (imgW * img.h) / img.w;
      const maxImgH = 115;
      if (imgH > maxImgH) {
        imgH = maxImgH;
        imgW = (imgH * img.w) / img.h;
      }
    }

    const linhas = doc.splitTextToSize(r.descricao, maxW);
    const blocoH = 6 + imgH + 4 + linhas.length * 5 + 8;

    if (y + blocoH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(43, 58, 143);
    doc.text(`Registro ${i + 1}`, margin, y);
    y += 6;

    if (img) {
      doc.addImage(r.foto_data, "JPEG", margin + (maxW - imgW) / 2, y, imgW, imgH);
    }
    y += imgH + 4;

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(40, 40, 40);
    doc.text(linhas, margin, y);
    y += linhas.length * 5 + 8;
  }

  // --- Rodapé com paginação ---
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(150);
    doc.text(`Página ${p} de ${total}`, pageW / 2, pageH - 8, { align: "center" });
  }

  doc.save(`recebimento-anexo3-${slug(obra)}.pdf`);
}
