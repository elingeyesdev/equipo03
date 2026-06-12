import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { WaitlistService } from '../application/waitlist.service';
import {
  CreateWaitlistEntryDto,
  UpdateWaitlistStatusDto,
} from '../application/dtos/waitlist.dto';

@ApiTags('Waitlist')
@Controller('waitlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WaitlistController {
  constructor(private readonly svc: WaitlistService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar a lista de espera' })
  @ApiBody({ type: CreateWaitlistEntryDto })
  create(@Body() body: CreateWaitlistEntryDto) {
    return this.svc.create(body);
  }

  @Get('schedule/:scheduleId')
  @ApiOperation({ summary: 'Lista de espera por horario' })
  findBySchedule(@Param('scheduleId', ParseIntPipe) sid: number) {
    return this.svc.findBySchedule(sid);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Esperas de usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findByUser(uid);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar estado' })
  @ApiBody({ type: UpdateWaitlistStatusDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWaitlistStatusDto,
  ) {
    return this.svc.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar de espera' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
