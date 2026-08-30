import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { db } from '../db';
import { verificationTokens, users, passwordResetTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !user.passwordHash) return null;

    if (!user.emailVerified) {
      throw new UnauthorizedException('Por favor, verifique seu e-mail antes de fazer login.');
    }

    const isBcrypt = await bcrypt.compare(pass, user.passwordHash).catch(() => false);

    if (isBcrypt) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async register(data: any) {
    // Check if user already exists
    const existing = await this.usersService.findOneByEmail(data.email);
    if (existing) {
      if (existing.emailVerified) {
        throw new BadRequestException('E-mail já está em uso.');
      }
      // If user exists but is not verified, we can just resend the code
    }

    let user = existing;
    if (!user) {
      user = await this.usersService.create(data);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    // Save token
    await db.insert(verificationTokens).values({
      identifier: data.email,
      token: code,
      expires,
    });

    // Send email via Resend
    await this.emailService.sendRegistrationEmail(data.email, code);

    return { 
      message: 'Código de verificação enviado.',
      requiresVerification: true 
    };
  }

  async verifyRegistrationCode(email: string, code: string) {
    const [tokenRecord] = await db.select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, code),
          gt(verificationTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    // Mark as verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.id, user.id));

    // Delete token
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));

    return this.login(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Return success silently for security
      return { message: 'Se o e-mail existir, um código foi enviado.' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration

    // Save token in passwordResetTokens table
    await db.insert(passwordResetTokens).values({
      identifier: email,
      token: code,
      expires,
    });

    // Send recovery email via Resend
    await this.emailService.sendPasswordResetEmail(email, code);

    return { message: 'Se o e-mail existir, um código foi enviado.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const [tokenRecord] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.identifier, email),
          eq(passwordResetTokens.token, code),
          gt(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Delete token
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.identifier, email));

    return { message: 'Senha alterada com sucesso.' };
  }
}
