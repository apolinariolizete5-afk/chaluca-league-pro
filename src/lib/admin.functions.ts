import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRow = {
  user_id: string;
  email: string | null;
  created_at: string;
};

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminRow[]> => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,email,created_at")
      .eq("role", "admin")
      .order("created_at");
    if (error) throw new Error(error.message);

    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const byId = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return (roles ?? []).map((r) => ({
      user_id: r.user_id,
      email: r.email ?? byId.get(r.user_id) ?? null,
      created_at: r.created_at,
    }));
  });

function safeOrigin(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Origem inválida");
  return url.origin;
}

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; origin: string }) => {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido");
    return { email, origin: safeOrigin(input.origin) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = crypto.randomUUID().replace(/-/g, "");
    const link = `${data.origin}/convite/${token}`;

    const { error } = await supabaseAdmin
      .from("admin_invites")
      .insert({ email: data.email, token, invited_by: context.userId });
    if (error) throw new Error(error.message);

    const { error: mailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: link,
    });

    return { link, emailed: !mailError, reason: mailError?.message ?? null };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; origin: string }) => ({
    id: input.id,
    origin: safeOrigin(input.origin),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("admin_invites")
      .select("id,email,token,used_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite || invite.used_at) throw new Error("Convite indisponível");

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("admin_invites").update({ expires_at: expires }).eq("id", invite.id);

    const link = `${data.origin}/convite/${invite.token}`;
    const { error: mailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(invite.email, {
      redirectTo: link,
    });

    return { link, emailed: !mailError, reason: mailError?.message ?? null };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: ok, error } = await context.supabase.rpc("remove_admin", {
      _user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: Boolean(ok) };
  });
