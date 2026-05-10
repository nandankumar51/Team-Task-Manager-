type InvitationEmailInput = {
  to: string;
  inviterName: string;
  workspaceName: string;
  projectName: string;
  inviteUrl: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export function buildInviteUrl(email: string) {
  const url = new URL("/signup", appUrl());
  url.searchParams.set("email", email);
  return url.toString();
}

export async function sendInvitationEmail(input: InvitationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;

  if (!apiKey || !from) {
    console.info(
      `Invitation email not sent because RESEND_API_KEY or INVITE_EMAIL_FROM is missing. Invite link for ${input.to}: ${input.inviteUrl}`
    );
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `${input.inviterName} invited you to ${input.workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h1 style="font-size: 22px;">You're invited to Team Task Manager</h1>
          <p>${input.inviterName} invited you to join <strong>${input.workspaceName}</strong> for the project <strong>${input.projectName}</strong>.</p>
          <p>Create your account with this email address to join the workspace and see your assigned project.</p>
          <p>
            <a href="${input.inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:700;">
              Accept invitation
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">If the button does not work, open this link: ${input.inviteUrl}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error(`Failed to send invitation email: ${message}`);
    return false;
  }

  return true;
}
