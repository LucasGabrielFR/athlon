import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Presumimos a existência de um AuthGuard customizado ou podemos usar as anotações do NextAuth se integradas.
// Aqui usaremos o user do request (req.user) ou pegaremos o ID via parametro/token dependendo da config atual.
// Supondo que você tem um Middleware/Guard injetando req.user.

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Unauthorized');
    }
    const notifs = await this.notificationsService.getNotifications(userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    
    return {
      unreadCount,
      notifications: notifs,
    };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markAsRead(id, userId);
  }
}
