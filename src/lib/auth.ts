import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "rp_sessao";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias
const secret = process.env.SESSION_SECRET || "dev-inseguro-troque-me";

export type Sessao = { email: string; isAdmin: boolean };

function assinar(payload: string): string {
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verificar(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const esperado = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return payload;
  return null;
}

export async function criarSessao(email: string, isAdmin: boolean): Promise<void> {
  const payload = `${email}|${isAdmin ? "1" : "0"}`;
  const c = await cookies();
  c.set(COOKIE, assinar(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function encerrarSessao(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getSessao(): Promise<Sessao | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verificar(token);
  if (!payload) return null;
  const [email, admin] = payload.split("|");
  if (!email) return null;
  return { email, isAdmin: admin === "1" };
}
