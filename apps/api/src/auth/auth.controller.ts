import { Controller, Post, Body, UnauthorizedException, BadRequestException, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!passwordRegex.test(body.password)) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.');
    }

    if (body.role === 'player' && !body.nickname) {
      throw new BadRequestException('Nickname é obrigatório para jogadores.');
    }

    const data = {
      name: body.name || body.nickname || body.email.split('@')[0], // placeholder name
      email: body.email,
      passwordHash: body.password,
      nickname: body.nickname || null,
      role: body.role || 'player',
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    };
    return this.authService.register(data);
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) {
      throw new UnauthorizedException('Email e código são obrigatórios.');
    }
    return this.authService.verifyRegistrationCode(body.email, body.code);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    if (!body.email || !body.code || !body.newPassword) {
      throw new BadRequestException('E-mail, código e nova senha são obrigatórios.');
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!passwordRegex.test(body.newPassword)) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.');
    }
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }
}

