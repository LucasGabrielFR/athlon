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

    const data = {
      name: body.name,
      email: body.email,
      passwordHash: body.password,
      nickname: body.nickname || null,
      role: body.role || 'player',
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
}

