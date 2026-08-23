import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('players')
export class PlayersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async searchPlayers(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('modality') modalityStr?: string,
    @Query('position') positionStr?: string,
    @Query('status') status?: string,
    @Query('q') query?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 12;
    const modalityId = modalityStr ? parseInt(modalityStr, 10) : undefined;
    const positionId = positionStr ? parseInt(positionStr, 10) : undefined;

    return this.usersService.searchPlayers({
      page,
      limit,
      modalityId,
      positionId,
      status,
      query,
    });
  }
}
