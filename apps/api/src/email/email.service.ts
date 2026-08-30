import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly senderEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    
    // Fallback to onboarding@resend.dev as agreed
    this.senderEmail = this.configService.get<string>('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  }

  async sendRegistrationEmail(email: string, code: string) {
    try {
      const data = await this.resend.emails.send({
        from: `Athlon <${this.senderEmail}>`,
        to: email,
        subject: 'Athlon - Verifique seu e-mail',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo ao Athlon!</h2>
            <p>Use o código abaixo para verificar sua conta:</p>
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #4F46E5;">${code}</h1>
            <p>Se você não solicitou este e-mail, pode ignorá-lo.</p>
          </div>
        `,
      });
      this.logger.log(`E-mail de verificação enviado para ${email} (ID: ${data?.data?.id})`);
      return data;
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail para ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, code: string) {
    try {
      const data = await this.resend.emails.send({
        from: `Athlon <${this.senderEmail}>`,
        to: email,
        subject: 'Athlon - Recuperação de Senha',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Senha</h2>
            <p>Você solicitou a redefinição da sua senha. Use o código abaixo para redefinir:</p>
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #E53E3E;">${code}</h1>
            <p>Este código expira em 1 hora.</p>
            <p>Se você não solicitou este e-mail, ignore-o e sua senha continuará a mesma.</p>
          </div>
        `,
      });
      this.logger.log(`E-mail de recuperação enviado para ${email} (ID: ${data?.data?.id})`);
      return data;
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de recuperação para ${email}:`, error);
      throw error;
    }
  }
}
