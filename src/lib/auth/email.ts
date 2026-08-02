// Pluggable email delivery. Local dev / tests use ConsoleSender (logs the link,
// no service). Production uses ResendSender when RESEND_API_KEY + EMAIL_FROM are
// set. Provider choice is env-driven [node:e65ec8a0].

export interface EmailSender {
  sendMagicLink(to: string, link: string): Promise<void>;
}

export class ConsoleSender implements EmailSender {
  async sendMagicLink(to: string, link: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[magic-link] to=${to} link=${link}`);
  }
}

export class ResendSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async sendMagicLink(to: string, link: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to,
        subject: 'Your Sound of Loam sign-in link',
        html: `<p>Sign in to Sound of Loam:</p><p><a href="${link}">${link}</a></p><p>This link expires in 10 minutes.</p>`,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status}`);
    }
  }
}

export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export function getSender(env: EmailEnv): EmailSender {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendSender(env.RESEND_API_KEY, env.EMAIL_FROM);
  }
  return new ConsoleSender();
}
