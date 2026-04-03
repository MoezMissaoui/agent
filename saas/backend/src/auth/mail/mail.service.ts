import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

/** Contrat d'envoi d'emails (SMTP ou log en dev). */
export abstract class MailService {
  abstract sendPasswordResetLink(to: string, resetUrl: string): Promise<void>;
}

/** Dev : log le lien dans la console (aucun SMTP requis). */
@Injectable()
export class DevMailService extends MailService {
  private readonly logger = new Logger(DevMailService.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  sendPasswordResetLink(to: string, resetUrl: string): Promise<void> {
    this.logger.log(
      `[DEV] Password reset for ${to} — open: ${resetUrl} (FRONTEND_URL=${this.config.get('FRONTEND_URL')})`,
    );
    return Promise.resolve();
  }
}

/** Production / staging : envoi via SMTP (ex. Gmail sur le port 465 SSL). */
@Injectable()
export class SmtpMailService extends MailService {
  private readonly logger = new Logger(SmtpMailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    const host = this.config.get<string>('MAIL_HOST', '');
    const port = parseInt(this.config.get<string>('MAIL_PORT', '465'), 10);
    const user = this.config.get<string>('MAIL_USERNAME', '');
    const pass = this.config.get<string>('MAIL_PASSWORD', '');
    const encryption = (
      this.config.get<string>('MAIL_ENCRYPTION', 'ssl') || ''
    ).toLowerCase();
    const secure = encryption === 'ssl' || port === 465;
    const useStartTls =
      encryption === 'starttls' || (encryption === 'tls' && port === 587);

    this.transporter = createTransport({
      host,
      port,
      secure,
      requireTLS: useStartTls,
      auth: { user, pass },
    });
  }

  async sendPasswordResetLink(to: string, resetUrl: string): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM_ADDRESS') ||
      this.config.get<string>('MAIL_USERNAME', '');
    const subject = this.config.get<string>(
      'MAIL_PASSWORD_RESET_SUBJECT',
      'Reset your password',
    );
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text: `Reset your password by opening this link:\n${resetUrl}`,
        html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (err) {
      this.logger.error('SMTP send failed', err);
      throw err;
    }
  }
}

/** SMTP actif si identifiants complets ; MAIL_MAILER=log force le log console uniquement. */
export function shouldUseSmtpMail(config: ConfigService): boolean {
  if ((config.get<string>('MAIL_MAILER', '') || '').toLowerCase() === 'log') {
    return false;
  }
  const host = config.get<string>('MAIL_HOST', '');
  const user = config.get<string>('MAIL_USERNAME', '');
  const pass = config.get<string>('MAIL_PASSWORD', '');
  return Boolean(host && user && pass);
}

/** SMTP dès que les identifiants sont renseignés (y compris en dev) ; sinon log console. */
export function createMailService(config: ConfigService): MailService {
  if (shouldUseSmtpMail(config)) {
    return new SmtpMailService(config);
  }
  return new DevMailService(config);
}
