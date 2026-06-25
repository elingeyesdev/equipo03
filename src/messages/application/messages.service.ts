import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessage } from '../domain/direct-message.entity';
import { Conversation } from '../domain/conversation.entity';
import { User } from '../../users/domain/user.entity';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';
import { PushNotificationsService } from '../../push-notifications/application/push-notifications.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(DirectMessage)
    private readonly messageRepo: Repository<DirectMessage>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: GymGateway,
    private readonly pushService: PushNotificationsService,
  ) {}

  // ── Helpers privados ───────────────────────────────────────────────────────

  private async getUserLevel(userId: number): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado.`);
    const levels = user.userRoles?.map((ur) => ur.role?.hierarchyLevel ?? 0) ?? [];
    return levels.length > 0 ? Math.max(...levels) : 0;
  }

  private async loadConversationForMember(
    conversationId: number,
    requesterId: number,
  ): Promise<Conversation> {
    const conv = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversación no encontrada.');
    if (conv.clientId !== requesterId && conv.trainerId !== requesterId) {
      throw new ForbiddenException('No perteneces a esta conversación.');
    }
    return conv;
  }

  // ── POST /messages/conversations ───────────────────────────────────────────
  async getOrCreateConversation(requesterId: number, targetUserId: number): Promise<Conversation> {
    const [requesterLevel, targetLevel] = await Promise.all([
      this.getUserLevel(requesterId),
      this.getUserLevel(targetUserId),
    ]);

    let clientId: number;
    let trainerId: number;

    if (requesterLevel === 1 && targetLevel === 3) {
      clientId  = requesterId;
      trainerId = targetUserId;
    } else if (requesterLevel === 3 && targetLevel === 1) {
      clientId  = targetUserId;
      trainerId = requesterId;
    } else {
      throw new ForbiddenException(
        'Solo un Cliente (nivel 1) puede iniciar chat con un Entrenador (nivel 3).',
      );
    }

    const existing = await this.conversationRepo.findOne({
      where: { clientId, trainerId },
    });
    if (existing) return existing;

    const conv = this.conversationRepo.create({ clientId, trainerId });
    return this.conversationRepo.save(conv);
  }

  // ── POST /messages ─────────────────────────────────────────────────────────
  async sendMessage(
    senderId: number,
    conversationId: number,
    content: string,
  ): Promise<DirectMessage> {
    const conv = await this.loadConversationForMember(conversationId, senderId);

    const receiverId = senderId === conv.clientId ? conv.trainerId : conv.clientId;

    const message = this.messageRepo.create({ conversationId, senderId, content });
    const saved   = await this.messageRepo.save(message);

    this.gateway.emitToUser(receiverId, 'chat_message', {
      messageId:      saved.id,
      conversationId,
      senderId,
      content,
      createdAt:      saved.createdAt,
    });

    // Fire-and-forget: no bloquea el HTTP response del emisor.
    // Se usa IIFE async en lugar de .then() para evitar fallos silenciosos de
    // TypeORM al restringir columnas con select (mapeo camelCase vs snake_case).
    void (async () => {
      try {
        const receiver = await this.userRepo.findOne({ where: { id: receiverId } });
        if (receiver?.pushToken) {
          const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
          await this.pushService.sendPushMessage(
            receiver.pushToken,
            'Nuevo mensaje',
            preview,
            { type: 'CHAT_MESSAGE', conversationId, senderId },
          );
        } else {
          this.logger.warn(`[push] Usuario ${receiverId} no tiene pushToken registrado.`);
        }
      } catch (e) {
        this.logger.error(`[push] Error enviando notificación al usuario ${receiverId}:`, e);
      }
    })();

    return saved;
  }

  // ── GET /messages/conversations/:id ───────────────────────────────────────
  async getHistory(requesterId: number, conversationId: number): Promise<DirectMessage[]> {
    await this.loadConversationForMember(conversationId, requesterId);

    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  // ── GET /messages/conversations (inbox) ───────────────────────────────────
  async getUserConversations(userId: number): Promise<Conversation[]> {
    return this.conversationRepo.find({
      where: [{ clientId: userId }, { trainerId: userId }],
      relations: ['client', 'client.profile', 'trainer', 'trainer.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── DELETE /messages/conversations/:id ───────────────────────────────────
  async deleteConversation(requesterId: number, conversationId: number) {
    const conv = await this.loadConversationForMember(conversationId, requesterId);
    const result = await this.conversationRepo.delete(conv.id);
    if (result.affected === 0) {
      throw new NotFoundException('No se pudo eliminar la conversación.');
    }
    return { message: 'Conversación eliminada para ambos usuarios.' };
  }

  // ── PATCH /messages/conversations/:id/read ────────────────────────────────
  async markAsRead(requesterId: number, conversationId: number): Promise<{ updated: number }> {
    await this.loadConversationForMember(conversationId, requesterId);

    const result = await this.messageRepo
      .createQueryBuilder()
      .update(DirectMessage)
      .set({ readAt: new Date() })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :requesterId', { requesterId })
      .andWhere('read_at IS NULL')
      .execute();

    return { updated: result.affected ?? 0 };
  }
}
