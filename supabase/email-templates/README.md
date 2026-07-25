# Supabase Auth email templates

Branded HTML for Supabase's built-in auth emails (navy `#111A2E` + green `#22A065`).
Paste each file into **Supabase Dashboard → Authentication → Email Templates**,
in the matching slot, and set the subject shown below.

| File | Supabase template slot | Suggested subject |
|------|------------------------|-------------------|
| `reset-password.html`  | **Reset Password**   | `Reset your PrimeIT Talent Stream password` |
| `invite.html`          | **Invite user**      | `You're invited to PrimeIT Talent Stream` |
| `confirm-signup.html`  | **Confirm signup**   | `Confirm your PrimeIT Talent Stream email` |

## How to apply
1. Open the template file, copy **all** the HTML.
2. In the dashboard, pick the slot, paste into the message body, set the subject.
3. Save.

## Notes
- `{{ .ConfirmationURL }}` and `{{ .Email }}` are Supabase template variables — leave
  them exactly as written; Supabase fills them in per email.
- For `{{ .ConfirmationURL }}` to redirect to our app pages (`/reset-password`,
  `/accept-invite`), add those URLs under **Auth → URL Configuration → Redirect URLs**.
- These are used only by Supabase's own auth mailer. The admin **invite-user** edge
  function sends its own Resend email with its own template (see
  `supabase/functions/invite-user/index.ts`), so the `invite.html` slot only applies
  if you ever fall back to Supabase's native `inviteUserByEmail`.
- To send these through your Resend domain instead of Supabase's shared mailer,
  configure **Auth → SMTP Settings** with `smtp.resend.com` (user `resend`, password =
  your `RESEND_API_KEY`).
