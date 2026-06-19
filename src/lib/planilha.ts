// Extrai os itens (serviços) de uma planilha orçamentária .xlsx/.xls/.csv.
// A planilha tem colunas ITEM (1, 1.1, 1.1.1...), DESCRIÇÃO, UNID e QUANT.
// O cabeçalho pode se repetir a cada página; varremos a planilha inteira.
import * as XLSX from "xlsx";

export type ServicoImport = {
  item: string;
  descricao: string;
  unidade: string | null;
  quantidade: number | null;
};

// Remove acentos e baixa caixa para comparar cabeçalhos de forma tolerante.
function normalizar(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Um código de item da cascata: "1", "1.1", "12.3.4" (sem texto junto).
function ehItem(valor: unknown): string | null {
  const s = String(valor ?? "").trim();
  if (/^\d+(\.\d+)*$/.test(s)) return s;
  return null;
}

// "1.234,56" / "470,80" / number -> 470.8 ; vazio -> null
function parseNumero(valor: unknown): number | null {
  if (valor == null || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const s = String(valor).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Mapa = {
  item: number;
  codigo: number;
  descricao: number;
  unidade: number;
  quantidade: number;
};

// Procura, numa linha, os índices das colunas pelos rótulos do cabeçalho.
function detectarColunas(linha: unknown[]): Mapa | null {
  let item = -1,
    codigo = -1,
    descricao = -1,
    unidade = -1,
    quantidade = -1;
  linha.forEach((celula, i) => {
    const c = normalizar(celula);
    if (item < 0 && c === "item") item = i;
    else if (codigo < 0 && (c === "codigo" || c === "cod")) codigo = i;
    else if (descricao < 0 && c.startsWith("descri")) descricao = i;
    else if (unidade < 0 && (c === "unid" || c === "und" || c === "unidade")) unidade = i;
    else if (quantidade < 0 && (c === "quant" || c === "quant." || c.startsWith("quantid")))
      quantidade = i;
  });
  if (item >= 0 && descricao >= 0) return { item, codigo, descricao, unidade, quantidade };
  return null;
}

export async function extrairServicos(file: File): Promise<ServicoImport[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const servicos: ServicoImport[] = [];
  const vistos = new Set<string>();

  for (const nomeAba of wb.SheetNames) {
    const sheet = wb.Sheets[nomeAba];
    const linhas = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    let mapa: Mapa | null = null;
    for (const linha of linhas) {
      // Atualiza o mapeamento de colunas sempre que reencontrar um cabeçalho.
      const novoMapa = detectarColunas(linha);
      if (novoMapa) {
        mapa = novoMapa;
        continue;
      }
      if (!mapa) continue;

      const item = ehItem(linha[mapa.item]);
      if (!item) continue;

      // Nas linhas de grupo (1, 1.1) o nome vem na coluna CÓDIGO e a DESCRIÇÃO
      // fica vazia; nas folhas (1.1.1) a descrição está na própria coluna.
      let descricao = String(linha[mapa.descricao] ?? "").trim();
      if (!descricao && mapa.codigo >= 0) {
        descricao = String(linha[mapa.codigo] ?? "").trim();
      }
      if (!descricao) continue;

      // Evita duplicar quando o mesmo item aparece em páginas repetidas.
      if (vistos.has(item)) continue;
      vistos.add(item);

      servicos.push({
        item,
        descricao,
        unidade: mapa.unidade >= 0 ? String(linha[mapa.unidade] ?? "").trim() || null : null,
        quantidade: mapa.quantidade >= 0 ? parseNumero(linha[mapa.quantidade]) : null,
      });
    }

    // Usa apenas a primeira aba que contém itens (a planilha orçamentária),
    // evitando duplicar com abas de cronograma/testes/aditivos.
    if (servicos.length > 0) break;
  }

  // Ordena pela cascata numérica (1, 1.1, 1.2, 1.10, 2, ...).
  servicos.sort((a, b) => compararItem(a.item, b.item));
  return servicos;
}

// Compara "1.10" depois de "1.2" tratando cada segmento como número.
export function compararItem(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const da = pa[i] ?? -1;
    const db = pb[i] ?? -1;
    if (da !== db) return da - db;
  }
  return 0;
}

export function nivelDoItem(item: string): number {
  return item.split(".").length;
}
