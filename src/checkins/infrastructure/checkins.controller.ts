import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CheckinsService } from '../application/checkins.service';
import { CreateCheckInDto } from '../application/dtos/checkins.dto';

@ApiTags('Check-ins')
@Controller('checkins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CheckinsController {
    constructor(private readonly svc: CheckinsService) {}

    @Get('history')
    @ApiOperation({ summary: 'Obtener historial de auditoría detallado para Mobile/Web' })
    async getHistory() {
        return await this.svc.findAllHistory();
    }

    @Post()
    @ApiOperation({ summary: 'Registrar check-in' })
    @ApiBody({ type: CreateCheckInDto })
    create(@Body() body: CreateCheckInDto) {
        return this.svc.create(body);
    }

    @Get()
    @ApiOperation({ summary: 'Listar check-ins (Vista simple)' })
    findAll() {
        return this.svc.findAll();
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Check-ins de un usuario específico' })
    findByUser(@Param('userId', ParseIntPipe) uid: number) {
        return this.svc.findByUser(uid);
    }

    @Get('gym/:gymId')
    @ApiOperation({ summary: 'Check-ins de un gimnasio específico' })
    findByGym(@Param('gymId', ParseIntPipe) gid: number) {
        return this.svc.findByGym(gid);
    }

    @Put(':id/checkout')
    @ApiOperation({ summary: 'Registrar check-out' })
    checkOut(@Param('id', ParseIntPipe) id: number) {
        return this.svc.checkOut(id);
    }
}
