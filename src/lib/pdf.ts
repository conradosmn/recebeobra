import { jsPDF } from "jspdf";

type Registro = {
  descricao: string;
  foto_data: string;
  criado_em: string;
  servico?: string | null;
};

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

// Desenha a grade de registros (2 colunas x 2 linhas = 4 por página) a
// partir de `topoInicial`, quebrando página automaticamente.
async function desenharGrade(
  doc: jsPDF,
  registros: Registro[],
  margin: number,
  maxW: number,
  topoInicial: number
): Promise<void> {
  const colGap = 8;
  const cellW = (maxW - colGap) / 2; // largura de cada coluna
  const servFont = 8; // item do serviço vinculado (acima da foto)
  const servLineH = 3.2;
  const maxServLinhas = 2;
  const servBlockH = maxServLinhas * servLineH; // espaço reservado acima da foto
  const gapServImg = 2;
  const imgAreaH = 76; // altura reservada para a foto em cada célula
  const gapImgText = 4; // espaço entre foto e descrição
  const descFont = 9;
  const lineH = 3.6;
  const maxDescLinhas = 3; // descrição limitada para manter a grade alinhada
  const rowH = servBlockH + gapServImg + imgAreaH + gapImgText + maxDescLinhas * lineH + 6;

  let gridTop = topoInicial;

  for (let i = 0; i < registros.length; i++) {
    const slot = i % 4;
    if (slot === 0 && i > 0) {
      doc.addPage();
      gridTop = margin;
    }
    const col = slot % 2;
    const row = Math.floor(slot / 2);
    const cellX = margin + col * (cellW + colGap);
    const cellY = gridTop + row * rowH;

    const r = registros[i];
    const img = await carregarImagem(r.foto_data);

    // Serviço vinculado (item) acima da foto, em destaque.
    if (r.servico) {
      doc.setFont("helvetica", "bold").setFontSize(servFont).setTextColor(43, 58, 143);
      let serv: string[] = doc.splitTextToSize(r.servico, cellW);
      if (serv.length > maxServLinhas) {
        serv = serv.slice(0, maxServLinhas);
        serv[maxServLinhas - 1] = serv[maxServLinhas - 1].replace(/.$/, "") + "…";
      }
      doc.text(serv, cellX + cellW / 2, cellY + servLineH, {
        align: "center",
        lineHeightFactor: 1.2,
      });
    }

    const imgTop = cellY + servBlockH + gapServImg;

    // Foto: encaixada (contain) e centralizada na área da célula.
    if (img) {
      let iw = cellW;
      let ih = (cellW * img.h) / img.w;
      if (ih > imgAreaH) {
        ih = imgAreaH;
        iw = (imgAreaH * img.w) / img.h;
      }
      doc.addImage(
        r.foto_data,
        "JPEG",
        cellX + (cellW - iw) / 2,
        imgTop + (imgAreaH - ih) / 2,
        iw,
        ih
      );
    }

    // Descrição (numerada) logo abaixo da foto, alinhada na base da área.
    doc.setFont("helvetica", "normal").setFontSize(descFont).setTextColor(40, 40, 40);
    let linhas: string[] = doc.splitTextToSize(`${i + 1}. ${r.descricao}`, cellW);
    if (linhas.length > maxDescLinhas) {
      linhas = linhas.slice(0, maxDescLinhas);
      linhas[maxDescLinhas - 1] = linhas[maxDescLinhas - 1].replace(/.$/, "") + "…";
    }
    doc.text(linhas, cellX + cellW / 2, imgTop + imgAreaH + gapImgText, {
      align: "center",
      lineHeightFactor: 1.2,
    });
  }
}

// Desenha o cabeçalho (logo + título + obra/responsável/data) a partir da
// margem e retorna o y onde a grade de fotos deve começar.
async function desenharCabecalho(
  doc: jsPDF,
  pageW: number,
  margin: number,
  obra: string,
  autor: string,
  logo: Img | null
): Promise<number> {
  let y = margin;

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

  return y;
}

function numerarPaginas(doc: jsPDF, pageW: number, pageH: number): void {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(150);
    doc.text(`Página ${p} de ${total}`, pageW / 2, pageH - 8, { align: "center" });
  }
}

export async function gerarPdf({ obra, autor, registros }: Dados): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;

  const logo = await carregarLogo();
  const y = await desenharCabecalho(doc, pageW, margin, obra, autor, logo);
  await desenharGrade(doc, registros, margin, maxW, y);
  numerarPaginas(doc, pageW, pageH);

  doc.save(`recebimento-anexo3-${slug(obra)}.pdf`);
}

// Relatório fotográfico de TODOS os usuários de uma obra: uma seção por
// autor (cabeçalho + grade própria, sempre começando em página nova).
export async function gerarPdfGeral({
  obra,
  secoes,
}: {
  obra: string;
  secoes: { autor: string; registros: Registro[] }[];
}): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;

  const logo = await carregarLogo();

  for (let i = 0; i < secoes.length; i++) {
    if (i > 0) doc.addPage();
    const secao = secoes[i];
    const y = await desenharCabecalho(doc, pageW, margin, obra, secao.autor, logo);
    await desenharGrade(doc, secao.registros, margin, maxW, y);
  }

  numerarPaginas(doc, pageW, pageH);

  doc.save(`recebimento-anexo3-${slug(obra)}-geral.pdf`);
}
