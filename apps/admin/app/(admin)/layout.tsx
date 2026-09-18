import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { UIProvider } from "@/components/UIProvider";
import { Sidebar } from "@/components/Sidebar";
import { AIAssistant } from "@/components/AIAssistant";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email = "";
  try {
    const supabase = await createSupabaseAdminServerClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? "";
  } catch {
    /* sidebar tetap render tanpa email */
  }

  return (
    <UIProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar email={email} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <AIAssistant />
    </UIProvider>
  );
}
