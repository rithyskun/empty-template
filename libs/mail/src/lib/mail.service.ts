import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromAddress = process.env.SMTP_FROM || '"ERP" <noreply@erp.local>';

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
        });
        this.logger.log(
          `Initialized SMTP Mail Transporter via ${host}:${port}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to initialize SMTP Mail Transporter: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        'SMTP configuration is incomplete. MailService is running in DEVELOPMENT SIMULATION mode (emails will be logged to console instead of sent).',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      // Print beautiful, structured simulated mail to console for local testing
      this.logger.warn('\n=========================================');
      this.logger.warn(`SIMULATED EMAIL TO: ${to}`);
      this.logger.warn(`SUBJECT: ${subject}`);
      this.logger.warn('-----------------------------------------');
      this.logger.warn(
        `BODY:\n${html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()}`,
      ); // Strip HTML tags for clean console display
      this.logger.warn('=========================================\n');
      return true;
    }

    try {
      this.logger.log(`Sending email to: ${to} with subject: "${subject}"`);
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${(err as Error).message}`,
      );
      return false;
    }
  }
}
