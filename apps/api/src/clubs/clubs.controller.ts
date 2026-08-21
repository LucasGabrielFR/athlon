import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  async searchClubs(
    @Query('q') query?: string,
    @Query('modality') modality?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.clubsService.searchClubs(query, modality ? Number(modality) : undefined, p, l);
  }

  @Get(':id/details')
  async getClubDetails(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.getClubDetails(id);
  }

  @Post()
  async createClub(@Request() req: any, @Body() data: any) {
    return this.clubsService.createClub(req.user.id, data);
  }

  @Post(':id/invites')
  async sendInvite(
    @Request() req: any,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() data: any
  ) {
    return this.clubsService.sendInvite(clubId, req.user.id, data);
  }

  @Post(':id/requests')
  async requestJoin(
    @Request() req: any,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() data: any
  ) {
    return this.clubsService.requestJoin(clubId, req.user.id, data);
  }

  @Put('invites/:id/accept')
  async acceptInvite(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.clubsService.respondToInvitation(id, req.user.id, true);
  }

  @Put('invites/:id/reject')
  async rejectInvite(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.clubsService.respondToInvitation(id, req.user.id, false);
  }

  @Put('requests/:id/accept')
  async acceptRequest(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.clubsService.respondToJoinRequest(id, req.user.id, true);
  }

  @Put('requests/:id/reject')
  async rejectRequest(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.clubsService.respondToJoinRequest(id, req.user.id, false);
  }

  @Delete(':clubId/members/:memberId')
  async dismissMember(
    @Request() req: any,
    @Param('clubId', ParseIntPipe) clubId: number,
    @Param('memberId', ParseIntPipe) memberId: number
  ) {
    return this.clubsService.dismissMember(clubId, memberId, req.user.id);
  }

  @Delete(':clubId/leave')
  async leaveClub(
    @Request() req: any,
    @Param('clubId', ParseIntPipe) clubId: number
  ) {
    return this.clubsService.leaveClub(clubId, req.user.id);
  }
}
