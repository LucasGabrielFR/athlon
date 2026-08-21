import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ClubsModule } from './clubs/clubs.module';
import { ModalitiesModule } from './modalities/modalities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClubsModule,
    ModalitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
