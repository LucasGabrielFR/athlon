import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ClubsModule } from './clubs/clubs.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { StatsModule } from './stats/stats.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClubsModule,
    ModalitiesModule,
    CompetitionsModule,
    StatsModule,
    NotificationsModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        console.log('HTTP REQ:', req.method, req.originalUrl);
        next();
      })
      .forRoutes('*');
  }
}
