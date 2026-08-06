import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: data.user.id } });
  return NextResponse.redirect(`${origin}${usuari ? "/dashboard" : "/onboarding"}`);
}
