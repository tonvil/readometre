"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nom = formData.get("nom") as string;
  const cognom = formData.get("cognom") as string;
  const dataNaixement = formData.get("dataNaixement") as string;

  if (!nom || !cognom) {
    return { error: "Omple el nom i el cognom." };
  }

  await prisma.usuari.create({
    data: {
      id: user.id,
      nom,
      cognom,
      email: user.email!,
      dataNaixement: dataNaixement ? new Date(dataNaixement) : undefined,
    },
  });

  redirect("/dashboard");
}
