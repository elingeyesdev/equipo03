import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { DashboardService, Period } from '../application/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AdminLevelGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Totales + historial para sparklines (SUPER_ADMIN / GERENTE)',
    description: 'Soporta period=week (7 días), month (30 días) o year (12 meses)',
  })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN o GERENTE' })
  getSummary(@Query('period') period?: string) {
    const safe: Period =
      period === 'month' || period === 'year' ? period : 'week';
    return this.svc.getSummary(safe);
  }
}
