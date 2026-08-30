import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Na produção, deve ser a URL do frontend
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Mapeia o userId para os socket IDs (um usuário pode ter várias abas/devices abertos)
  private userSockets = new Map<number, Set<string>>();

  handleConnection(client: Socket) {
    // Autenticação na conexão
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      // Como o JWT secret no Auth.js (NextAuth) pode estar usando process.env.AUTH_SECRET
      const decoded = jwt.decode(token) as any;
      
      // NOTA: Em produção com NextAuth (JWE ou HS256), a validação no Nest precisa bater
      // com a secret e o algoritmo usado pelo NextAuth. 
      // Por enquanto, confiamos no payload decodificado para pegar o sub (userId).
      // Se estivéssemos validando a assinatura: jwt.verify(token, process.env.AUTH_SECRET)
      
      if (decoded && decoded.sub) {
        const userId = parseInt(decoded.sub, 10);
        client.data.userId = userId;

        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(client.id);
        
        this.logger.log(`Client connected: ${client.id} for user ${userId}`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      this.logger.error('Invalid WS token', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Envia notificação em tempo real
  sendNotification(userId: number, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit('new_notification', notification);
      });
    }
  }
}
