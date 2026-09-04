import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, 'profiles');
    return { url };
  }

  @Post('club')
  @UseInterceptors(FileInterceptor('file'))
  async uploadClubImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, 'clubs');
    return { url };
  }

  @Post('organization')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrganizationImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, 'organizations');
    return { url };
  }

  @Post('feed')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFeedImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, 'feed');
    return { url };
  }

  @Post('match-evidence')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMatchEvidence(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.uploadService.uploadFile(file, 'matches');
    return { url };
  }
}
