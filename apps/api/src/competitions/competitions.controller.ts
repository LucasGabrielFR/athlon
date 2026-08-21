import { Controller, Get, Post, Put, Delete, Param, UseGuards, Request, ParseIntPipe, Query, Body } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.competitionsService.getDashboard(req.user.sub);
  }

  @Get('new-form-data')
  async getNewFormData(@Request() req: any) {
    return this.competitionsService.getNewFormData(req.user.sub);
  }

  @Get(':id/dashboard-details')
  async getDashboardDetails(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.getDashboardDetails(id);
  }

  @Get(':id/roster-details')
  async getRosterDetails(
    @Param('id', ParseIntPipe) id: number, 
    @Query('registrationId', ParseIntPipe) registrationId: number
  ) {
    return this.competitionsService.getRosterDetails(id, registrationId);
  }

  @Get(':id/matches/:matchId')
  async getMatchDetails(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchId', ParseIntPipe) matchId: number
  ) {
    return this.competitionsService.getMatchDetails(id, matchId);
  }

  // === PHASE 2: MUTATIONS ===

  @Post()
  async createCompetition(@Request() req: any, @Body() body: any) {
    return this.competitionsService.createCompetition(req.user.sub, body);
  }

  @Post(':id/registrations')
  async registerClub(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: any) {
    return this.competitionsService.registerClub(id, req.user.sub, body);
  }

  @Put(':id/registrations/:regId/approve')
  async approveRegistration(
    @Param('id', ParseIntPipe) id: number,
    @Param('regId', ParseIntPipe) regId: number
  ) {
    return this.competitionsService.approveRegistration(id, regId);
  }

  @Post(':id/registrations/:regId/roster')
  async addToRoster(
    @Param('id', ParseIntPipe) id: number,
    @Param('regId', ParseIntPipe) regId: number,
    @Body() body: any
  ) {
    return this.competitionsService.addToRoster(id, regId, body);
  }

  @Delete(':id/registrations/:regId/roster/:userId')
  async removeFromRoster(
    @Param('id', ParseIntPipe) id: number,
    @Param('regId', ParseIntPipe) regId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.competitionsService.removeFromRoster(id, regId, userId);
  }

  @Post(':id/posts')
  async createCompetitionPost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: any
  ) {
    return this.competitionsService.createCompetitionPost(id, req.user.sub, body);
  }

  @Delete(':id/posts/:postId')
  async deleteCompetitionPost(
    @Param('id', ParseIntPipe) id: number,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.competitionsService.deleteCompetitionPost(id, postId);
  }

  // --- PHASE 3: MATCH ENGINE ---

  @Post(':id/generate-matches')
  async generateMatches(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.generateMatches(id);
  }

  @Put(':id/matches/:matchId/status')
  async updateMatchStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body('status') status: string
  ) {
    return this.competitionsService.updateMatchStatus(id, matchId, status);
  }

  @Post(':id/matches/:matchId/events')
  async recordMatchEvent(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: any
  ) {
    return this.competitionsService.recordMatchEvent(id, matchId, body);
  }

  @Post(':id/matches/:matchId/report')
  async submitMatchReport(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchId', ParseIntPipe) matchId: number,
    @Request() req: any,
    @Body() body: any
  ) {
    return this.competitionsService.submitMatchReport(id, matchId, req.user.sub, body);
  }

  @Post(':id/matches/:matchId/validate')
  async validateMatch(
    @Param('id', ParseIntPipe) id: number,
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: any
  ) {
    return this.competitionsService.validateMatch(id, matchId, body);
  }

  @Delete(':id')
  async deleteCompetition(@Param('id', ParseIntPipe) id: number) {
    return this.competitionsService.deleteCompetition(id);
  }

  @Put(':id/status')
  async updateCompetitionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string
  ) {
    return this.competitionsService.updateCompetitionStatus(id, status);
  }
}
