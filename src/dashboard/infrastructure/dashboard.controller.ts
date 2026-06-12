import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardService } from '../application/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Totales + historial de 7 días para sparklines (SUPER_ADMIN / GERENTE)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        users:        { total: 15, history: [{ v: 2 }, { v: 5 }, { v: 8 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }] },
        checkins:     { total: 3,  history: [{ v: 0 }, { v: 1 }, { v: 2 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }] },
        reservations: { total: 7,  history: [{ v: 1 }, { v: 3 }, { v: 3 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }] },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN o GERENTE' })
  getSummary() {
    return this.svc.getSummary();
  }
}
