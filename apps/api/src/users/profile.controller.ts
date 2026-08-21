import { Controller, Get, Put, Post, Delete, UseGuards, Request, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.usersService.getFullProfile(req.user.sub);
  }

  @Put()
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('modalities')
  async addModality(@Request() req: any, @Body() body: any) {
    return this.usersService.addPlayerModality(req.user.sub, body);
  }

  @Delete('modalities/:id')
  async removeModality(@Request() req: any, @Param('id') id: string) {
    return this.usersService.removePlayerModality(req.user.sub, Number(id));
  }

  @Put('active-modality')
  async setActiveModality(@Request() req: any, @Body() body: any) {
    return this.usersService.setActiveModality(req.user.sub, body.modalityId);
  }

  @Put('modalities/:id/positions')
  async updatePositions(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updatePlayerModalityPositions(req.user.sub, Number(id), body);
  }

  @Put('modalities/:id/free-agent')
  async toggleFreeAgent(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.usersService.toggleFreeAgentStatus(req.user.sub, Number(id), body);
  }
}
