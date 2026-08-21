import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(@Request() req: any, @Body() body: any) {
    return this.organizationsService.createOrganization(req.user.sub, body);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.organizationsService.getDetails(Number(id));
  }

  @Put(':id')
  async updateOrganization(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const org = await this.organizationsService.findOne(Number(id));
    if (org?.presidentId !== req.user.sub && req.user.role !== 'admin') {
      throw new UnauthorizedException();
    }
    return this.organizationsService.updateOrganization(Number(id), body);
  }

  @Post(':id/toggle-status')
  async toggleStatus(@Request() req: any, @Param('id') id: string) {
    const org = await this.organizationsService.findOne(Number(id));
    if (org?.presidentId !== req.user.sub && req.user.role !== 'admin') {
      throw new UnauthorizedException();
    }
    return this.organizationsService.toggleStatus(Number(id));
  }

  @Delete(':id')
  async deleteOrganization(@Request() req: any, @Param('id') id: string) {
    const org = await this.organizationsService.findOne(Number(id));
    if (org?.presidentId !== req.user.sub && req.user.role !== 'admin') {
      throw new UnauthorizedException();
    }
    return this.organizationsService.deleteOrganization(Number(id));
  }
}
