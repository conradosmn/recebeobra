"use server";

import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/auth";

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
