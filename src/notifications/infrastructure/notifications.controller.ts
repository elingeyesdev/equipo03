import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationsService } from '../application/notifications.service';
import {
  CreateTemplateDto,
  SendNotificationDto,
  UpdatePreferencesDto,
} from '../application/dtos/notifications.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Crear plantilla de notificación' })
  @ApiBody({ type: CreateTemplateDto })
  createTemplate(@Body() body: CreateTemplateDto) {
    return this.svc.createTemplate(body);
  }

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Listar plantillas' })
  findTemplates() {
    return this.svc.findAllTemplates();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiOperation({ summary: 'Enviar notificación' })
  @ApiBody({ type: SendNotificationDto })
  send(@Body() body: SendNotificationDto) {
    return this.svc.send(body);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Notificaciones de usuario' })
  findByUser(@Req() req: any, @Param('userId', ParseIntPipe) uid: number) {
    if (Number(req.user.userId) !== uid) {
      throw new ForbiddenException('Solo puedes ver tus propias notificaciones.');
    }
    return this.svc.findByUser(uid);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marcar como leída' })
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.svc.markAsRead(id);
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Obtener preferencias de notificación' })
  getPrefs(@Req() req: any, @Param('userId', ParseIntPipe) uid: number) {
    if (Number(req.user.userId) !== uid) {
      throw new ForbiddenException('Solo puedes ver tus propias preferencias.');
    }
    return this.svc.getPreferences(uid);
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Actualizar preferencias de notificación' })
  @ApiBody({ type: UpdatePreferencesDto })
  updatePrefs(@Req() req: any, @Param('userId', ParseIntPipe) uid: number, @Body() body: UpdatePreferencesDto) {
    if (Number(req.user.userId) !== uid) {
      throw new ForbiddenException('Solo puedes modificar tus propias preferencias.');
    }
    return this.svc.updatePreferences(uid, body);
  }
}
