import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { SubscriptionsService } from '../application/subscriptions.service';
import { CreatePlanDto, CreateSubscriptionDto, UpdateSubscriptionDto, CreatePaymentDto } from '../application/dtos/subscriptions.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Post('plans') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear plan de suscripción' })
  @ApiBody({ type: CreatePlanDto })
  createPlan(@Body() body: CreatePlanDto) { return this.svc.createPlan(body); }

  @Get('plans') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar planes' })
  findPlans() { return this.svc.findAllPlans(); }

  @Post() @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear suscripción de usuario' })
  @ApiBody({ type: CreateSubscriptionDto })
  create(@Body() body: CreateSubscriptionDto) { return this.svc.createSubscription(body); }

  @Get() @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar suscripciones' })
  findAll() { return this.svc.findAllSubscriptions(); }

  @Get('user/:userId') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Suscripciones de usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) { return this.svc.findByUser(uid); }

  @Get(':id') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener suscripción' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOneSubscription(id); }

  @Put(':id') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar suscripción' })
  @ApiBody({ type: UpdateSubscriptionDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSubscriptionDto) { return this.svc.updateSubscription(id, body); }

  @Post(':id/payments') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar pago' })
  @ApiBody({ type: CreatePaymentDto })
  createPayment(@Param('id', ParseIntPipe) id: number, @Body() body: CreatePaymentDto) { return this.svc.createPayment({ ...body, subscriptionId: id }); }

  @Get(':id/payments') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Pagos de suscripción' })
  findPayments(@Param('id', ParseIntPipe) id: number) { return this.svc.findPaymentsBySubscription(id); }
}
