import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ModalitiesService } from './modalities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('modalities')
@UseGuards(JwtAuthGuard)
export class ModalitiesController {
  constructor(private readonly modalitiesService: ModalitiesService) {}

  @Get()
  async getAllActive() {
    return this.modalitiesService.getAllActive();
  }

  @Get('admin-list')
  async getAdminList() {
    return this.modalitiesService.getAdminList();
  }

  @Post()
  async createModality(@Body() body: any) {
    return this.modalitiesService.createModality(body);
  }

  @Put()
  async updateModality(@Body() body: any) {
    return this.modalitiesService.updateModality(body);
  }

  @Put('deactivate')
  async deactivateModality(@Body() body: { id: number }) {
    return this.modalitiesService.deactivateModality(body.id);
  }

  @Put('reactivate')
  async reactivateModality(@Body() body: { id: number }) {
    return this.modalitiesService.reactivateModality(body.id);
  }

  @Post('positions')
  async createPosition(@Body() body: any) {
    return this.modalitiesService.createPosition(body);
  }

  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) {
    return this.modalitiesService.deletePosition(Number(id));
  }

  @Post('stat-types')
  async createStatType(@Body() body: any) {
    return this.modalitiesService.createStatType(body);
  }

  @Delete('stat-types/:id')
  async deleteStatType(@Param('id') id: string) {
    return this.modalitiesService.deleteStatType(Number(id));
  }
}
