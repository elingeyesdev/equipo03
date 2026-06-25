import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { MessagesService } from '../application/messages.service';
import { CreateConversationDto } from '../application/dtos/create-conversation.dto';
import { SendMessageDto } from '../application/dtos/send-message.dto';
import { DeleteMessageDto } from '../application/dtos/delete-message.dto';

// JwtAuthGuard ya está aplicado globalmente (APP_GUARD en AppModule).
// req.user.userId viene de JwtStrategy.validate() → { userId: payload.sub }
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // GET /api/messages/conversations  →  bandeja de entrada del usuario
  @Get('conversations')
  getMyConversations(@Req() req: any) {
    return this.messagesService.getUserConversations(Number(req.user.userId));
  }

  // POST /api/messages/conversations  →  { targetUserId }
  @Post('conversations')
  startConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.messagesService.getOrCreateConversation(Number(req.user.userId), dto.targetUserId);
  }

  // GET /api/messages/conversations/:id  →  historial de mensajes
  @Get('conversations/:id')
  getHistory(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagesService.getHistory(Number(req.user.userId), id);
  }

  // POST /api/messages  →  { conversationId, content }
  @Post()
  send(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(Number(req.user.userId), dto.conversationId, dto.content);
  }

  // DELETE /api/messages/conversations/:id  →  elimina conversación y mensajes (CASCADE)
  @Delete('conversations/:id')
  deleteConversation(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagesService.deleteConversation(Number(req.user.userId), id);
  }

  // PATCH /api/messages/:id/delete  →  { type: 'FOR_ME' | 'FOR_ALL' }
  // Definido antes de :id/read para que NestJS no confunda segmentos
  @Patch(':id/delete')
  deleteMessage(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DeleteMessageDto,
  ) {
    return this.messagesService.deleteMessage(id, Number(req.user.userId), body.type);
  }

  // PATCH /api/messages/conversations/:id/read
  @Patch('conversations/:id/read')
  markAsRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagesService.markAsRead(Number(req.user.userId), id);
  }

  // PATCH /api/messages/conversations/:id/clear  →  vaciar chat localmente (soft-delete masivo)
  @Patch('conversations/:id/clear')
  clearConversation(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagesService.clearConversation(Number(req.user.userId), id);
  }
}
