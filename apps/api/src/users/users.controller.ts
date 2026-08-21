import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/active-modality')
  async getActiveModality(@Request() req: any) {
    return this.usersService.getActiveModality(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notifications')
  async getNotifications(@Request() req: any, @Query('limit') limitStr: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.usersService.getNotifications(req.user.sub, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/invitations/pending')
  async getPendingInvitations(@Request() req: any) {
    return this.usersService.getPendingInvitations(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/presided-clubs')
  async getPresidedClubs(@Request() req: any) {
    return this.usersService.getPresidedClubs(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/organizations')
  async getPresidedOrganizations(@Request() req: any) {
    return this.usersService.getPresidedOrganizations(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/memberships')
  async getMemberships(@Request() req: any) {
    return this.usersService.getMemberships(req.user.sub);
  }
}
