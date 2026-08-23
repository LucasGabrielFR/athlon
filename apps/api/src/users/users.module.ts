import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { PlayersController } from './players.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController, ProfileController, PlayersController],
  exports: [UsersService],
})
export class UsersModule {}
