import { Module } from '@nestjs/common';
import { ModalitiesService } from './modalities.service';
import { ModalitiesController } from './modalities.controller';

@Module({
  providers: [ModalitiesService],
  controllers: [ModalitiesController]
})
export class ModalitiesModule {}
