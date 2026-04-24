import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { NotificationsService } from '../application/notifications.service';
import { CreateTemplateDto, SendNotificationDto, UpdatePreferencesDto } from '../application/dtos/notifications.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('templates') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear plantilla de notificación' })
  @ApiBody({ type: CreateTemplateDto })
  createTemplate(@Body() body: CreateTemplateDto) { return this.svc.createTemplate(body); }

  @Get('templates') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar plantillas' })
  findTemplates() { return this.svc.findAllTemplates(); }

  @Post() @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Enviar notificación' })
  @ApiBody({ type: SendNotificationDto })
  send(@Body() body: SendNotificationDto) { return this.svc.send(body); }

  @Get('user/:userId') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Notificaciones de usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) { return this.svc.findByUser(uid); }

  @Put(':id/read') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Marcar como leída' })
  markRead(@Param('id', ParseIntPipe) id: number) { return this.svc.markAsRead(id); }

  @Get('preferences/:userId') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener preferencias de notificación' })
  getPrefs(@Param('userId', ParseIntPipe) uid: number) { return this.svc.getPreferences(uid); }

  @Put('preferences/:userId') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar preferencias de notificación' })
  @ApiBody({ type: UpdatePreferencesDto })
  updatePrefs(@Param('userId', ParseIntPipe) uid: number, @Body() body: UpdatePreferencesDto) { return this.svc.updatePreferences(uid, body); }
}
