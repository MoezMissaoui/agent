import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { buildPasswordResetEmail } from './password-reset-email';

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
    const appName = this.config.get<string>('MAIL_APP_NAME', 'Control Plane');
    const ttl = parseInt(
      this.config.get<string>('PASSWORD_RESET_TTL_MINUTES', '60'),
      10,
    );
    const { text } = buildPasswordResetEmail({
      resetUrl,
      appName,
      ttlMinutes: ttl,
    });
    this.logger.log(
      `[DEV] Password reset for ${to} — ${resetUrl}\n---\n${text}\n---`,
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
    const appName = this.config.get<string>('MAIL_APP_NAME', 'Control Plane');
    const ttl = parseInt(
      this.config.get<string>('PASSWORD_RESET_TTL_MINUTES', '60'),
      10,
    );
    const { html, text } = buildPasswordResetEmail({
      resetUrl,
      appName,
      ttlMinutes: ttl,
    });
    const subject = this.config.get<string>(
      'MAIL_PASSWORD_RESET_SUBJECT',
      `Reset your ${appName} password`,
    );
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
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
