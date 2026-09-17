"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  
  if (password === process.env.ADMIN_PASSWORD) {
    (await cookies()).set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    redirect("/admin");
  } else {
    return { error: "Password salah!" };
  }
}

export async function logoutAction() {
  (await cookies()).delete("admin_session");
  redirect("/admin/login");
}