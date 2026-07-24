// Admin-only edge function: invite a person and grant them a chosen role.
//
// Flow:
//   1. Verify the caller is authenticated AND has the 'admin' role.
//   2. Validate the target email + role.
//   3. Record the invitation (so the DB `apply_invitation` trigger can grant the
//      chosen role the moment the invited auth user is created).
//   4. Create the invited auth user and send the invite email.
//
// Email delivery has two modes:
//   - Default (free): Supabase's built-in email sender (auth.admin.inviteUserByEmail).
//     Zero config, but rate-limited to a few emails/hour — fine for a low-volume MVP.
//   - Resend (optional): set RESEND_API_KEY to send a branded, higher-volume email.
//
// Optional secrets (set with `supabase secrets set ...`):
//   RESEND_API_KEY      — enables the Resend path (omit to use Supabase's free email)
//   INVITE_FROM_EMAIL   — Resend verified sender, e.g. "PrimeIT Talent <talent@primeit.pt>"
//   SITE_URL            — app origin used for the accept link, e.g. "https://talent.primeit.pt"
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the Supabase runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLES = ["admin", "recruiter"] as const;
type Role = (typeof ROLES)[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function inviteEmailHtml(link: string, role: Role, invitedBy: string) {
  // Brand palette, matched to the app's design tokens (src/index.css):
  //   navy   #111A2E  = --primary  hsl(222 47% 11%)
  //   green  #22A065  = --accent   hsl(152 65% 38%)
  const navy = "#111A2E";
  const green = "#22A065";
  const roleLabel = role === "admin" ? "Administrator" : "Recruiter";
  const safeLink = escapeHtml(link);
  return `<!doctype html>
  <html lang="en">
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin:0;padding:0;background:${navy};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You've been invited to PrimeIT Talent Stream — set your password to join.</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${navy};padding:40px 16px;">
        <tr><td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
            <!-- Header -->
            <tr><td style="background:${navy};padding:30px 36px;border-bottom:3px solid ${green};">
              <div style="color:${green};font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">PrimeIT</div>
              <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px;">Talent Stream</div>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:36px;">
              <span style="display:inline-block;background:rgba(34,160,101,0.12);color:${green};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">${roleLabel} access</span>
              <h1 style="margin:18px 0 12px;font-size:24px;line-height:1.25;color:${navy};">You've been invited</h1>
              <p style="margin:0 0 26px;color:#4b5563;font-size:15px;line-height:1.65;">
                ${escapeHtml(invitedBy)} invited you to the <strong>PrimeIT Talent Stream</strong> dashboard as
                <strong>${roleLabel}</strong>. Click below to set your password and activate your account.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:${green};">
                <a href="${safeLink}" style="display:inline-block;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:12px;font-size:15px;">
                  Accept invitation &rarr;
                </a>
              </td></tr></table>
              <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                Or paste this link into your browser:<br />
                <a href="${safeLink}" style="color:${green};word-break:break-all;font-size:12px;">${safeLink}</a>
              </p>
            </td></tr>
            <!-- Footer -->
            <tr><td style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This invitation expires in 7 days. If you weren't expecting it, you can safely ignore this email.
              </p>
            </td></tr>
          </table>
          <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:20px;">© ${new Date().getFullYear()} PrimeIT · Talent Stream</div>
        </td></tr>
      </table>
    </body>
  </html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM = Deno.env.get("INVITE_FROM_EMAIL") ??
      "PrimeIT Talent <onboarding@resend.dev>";
    const SITE_URL = Deno.env.get("SITE_URL") ?? new URL(req.url).origin;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    // 1) Identify the caller from their JWT.
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1b) Verify the caller has the 'admin' role.
    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!roleRows || roleRows.length === 0) {
      return json({ error: "Only admins can invite people" }, 403);
    }

    // 2) Validate input.
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "").trim() as Role;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Invalid email address" }, 400);
    }
    if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
    if (!email.endsWith("@primeit.pt")) {
      return json({ error: "Only @primeit.pt emails can be invited" }, 400);
    }

    // 3) Record the invitation BEFORE creating the auth user, so the
    //    apply_invitation trigger finds it and grants the chosen role.
    const { data: inv, error: invErr } = await admin
      .from("invitations")
      .insert({ email, role, invited_by: user.id })
      .select()
      .single();
    if (invErr) {
      if (invErr.code === "23505") {
        return json({ error: "There is already a pending invite for this email" }, 409);
      }
      return json({ error: invErr.message }, 400);
    }

    // 4) Create the auth user and deliver the invite email.
    const redirectTo = `${SITE_URL}/accept-invite`;

    // Default (free) path: let Supabase's built-in email service send the invite.
    // No extra provider or cost — ideal for an MVP with low volume. Note the
    // built-in sender is rate-limited (a few emails/hour). Set RESEND_API_KEY to
    // switch to a branded, higher-volume Resend email instead.
    if (!RESEND_API_KEY) {
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { invited_role: role },
      });
      if (inviteErr) {
        await admin.from("invitations").delete().eq("id", inv.id);
        const already = /registered|already|exists/i.test(inviteErr.message ?? "");
        const rateLimited = /rate|limit|too many/i.test(inviteErr.message ?? "");
        return json(
          {
            error: already
              ? "That email already has an account"
              : rateLimited
              ? "Supabase's free email limit was hit — wait a bit and try again, or configure Resend."
              : inviteErr.message,
          },
          already ? 409 : rateLimited ? 429 : 400,
        );
      }
      return json({ ok: true, invitation: inv });
    }

    // Resend path: generate the invite link (creates the auth user, sends no
    // email) and deliver a branded message ourselves.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo, data: { invited_role: role } },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      await admin.from("invitations").delete().eq("id", inv.id);
      const already = /registered|already|exists/i.test(linkErr?.message ?? "");
      return json(
        { error: already ? "That email already has an account" : (linkErr?.message ?? "Could not create invite link") },
        already ? 409 : 400,
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "You're invited to PrimeIT Talent Stream",
        html: inviteEmailHtml(linkData.properties.action_link, role, user.email ?? "An administrator"),
      }),
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      console.error("[invite-user] Resend error", emailRes.status, detail);
      return json(
        { error: "Invite was created but the email failed to send.", detail, invitation: inv },
        502,
      );
    }

    return json({ ok: true, invitation: inv });
  } catch (e) {
    console.error("[invite-user] unexpected", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
