import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VisitsService } from '../application/visits.service';
import { CreateVisitDto } from '../application/dtos/create-visit.dto';

@ApiTags('Visits (GPS)')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENTE', 'USER')
@ApiBearerAuth('access-token')
export class VisitsController {
  constructor(private readonly svc: VisitsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar visita GPS del cliente',
    description:
      'Solo CLIENTE. Persiste una visita física al gimnasio detectada por geolocalización en la app móvil. El userId se extrae del JWT.',
  })
  @ApiBody({ type: CreateVisitDto })
  @ApiResponse({ status: 201, description: 'Visita registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos (ej. exitedAt < enteredAt).' })
  @ApiResponse({ status: 403, description: 'Solo clientes pueden registrar visitas GPS.' })
  create(@Body() dto: CreateVisitDto) {
    return this.svc.create(dto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Historial de visitas GPS del cliente autenticado',
    description:
      'Solo CLIENTE. Devuelve todas las visitas físicas registradas del usuario autenticado, con nombre del gimnasio, ordenadas de más reciente a más antigua.',
  })
  @ApiResponse({ status: 200, description: 'Lista de visitas del cliente.' })
  @ApiResponse({ status: 403, description: 'Solo clientes pueden consultar este endpoint.' })
  findMe() {
    return this.svc.findMyVisits();
  }
}
