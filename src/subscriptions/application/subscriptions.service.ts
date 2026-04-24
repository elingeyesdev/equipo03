import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';
import { UserSubscription } from '../domain/user-subscription.entity';
import { SubscriptionPayment } from '../domain/subscription-payment.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan) private plansRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription) private subsRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPayment) private paymentsRepo: Repository<SubscriptionPayment>,
  ) {}

  createPlan(data: Partial<SubscriptionPlan>) { return this.plansRepo.save(this.plansRepo.create(data)); }
  findAllPlans() { return this.plansRepo.find(); }
  async findOnePlan(id: number) { const p = await this.plansRepo.findOne({ where: { id } }); if (!p) throw new NotFoundException(`Plan ${id} no encontrado`); return p; }

  createSubscription(data: any) { return this.subsRepo.save(this.subsRepo.create(data)); }
  findAllSubscriptions() { return this.subsRepo.find({ relations: ['user', 'plan', 'homeGym'] }); }
  findByUser(userId: number) { return this.subsRepo.find({ where: { userId }, relations: ['plan', 'homeGym'] }); }
  async findOneSubscription(id: number) { const s = await this.subsRepo.findOne({ where: { id }, relations: ['user', 'plan', 'homeGym'] }); if (!s) throw new NotFoundException(`Suscripción ${id} no encontrada`); return s; }
  async updateSubscription(id: number, data: any) { const s = await this.findOneSubscription(id); Object.assign(s, data); return this.subsRepo.save(s); }

  createPayment(data: any) { return this.paymentsRepo.save(this.paymentsRepo.create(data)); }
  findPaymentsBySubscription(subscriptionId: number) { return this.paymentsRepo.find({ where: { subscriptionId }, order: { paymentDate: 'DESC' } }); }
}
