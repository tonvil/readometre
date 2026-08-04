"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: "No s'ha pogut crear el compte. Torna-ho a provar." };
  }

  return { success: true };
}
