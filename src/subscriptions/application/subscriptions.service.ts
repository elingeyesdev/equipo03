import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../domain/subscription-plan.entity';
import { UserSubscription } from '../domain/user-subscription.entity';
import { SubscriptionPayment } from '../domain/subscription-payment.entity';
import {
  getManagerGymId,
  type RequestWithUser,
} from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private plansRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subsRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPayment)
    private paymentsRepo: Repository<SubscriptionPayment>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  createPlan(data: Partial<SubscriptionPlan>) {
    return this.plansRepo.save(this.plansRepo.create(data));
  }
  findAllPlans() {
    return this.plansRepo.find();
  }
  async findOnePlan(id: number) {
    const p = await this.plansRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Plan ${id} no encontrado`);
    return p;
  }

  createSubscription(data: any) {
    const mg = this.managerGymId();
    const merged = { ...data };
    if (mg !== null) {
      if (
        merged.homeGymId !== undefined &&
        merged.homeGymId !== null &&
        Number(merged.homeGymId) !== mg
      ) {
        throw new ForbiddenException(
          'No puede asignar suscripciones a otra sucursal',
        );
      }
      merged.homeGymId = mg;
    }
    return this.subsRepo.save(this.subsRepo.create(merged));
  }

  findAllSubscriptions() {
    const mg = this.managerGymId();
    const qb = this.subsRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.homeGym', 'homeGym');

    if (mg !== null) {
      qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findByUser(userId: number) {
    const mg = this.managerGymId();
    const qb = this.subsRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.homeGym', 'homeGym')
      .where('sub.user_id = :userId', { userId });

    if (mg !== null) {
      qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  async findOneSubscription(id: number) {
    const mg = this.managerGymId();

    const qb = this.subsRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.homeGym', 'homeGym')
      .where('sub.id = :id', { id });

    if (mg !== null) {
      qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
    }

    const s = await qb.getOne();
    if (s) return s;

    if (mg !== null) {
      const exists = await this.subsRepo.exist({ where: { id } });
      if (exists)
        throw new ForbiddenException(
          'No tiene permisos para acceder a esta suscripción',
        );
    }

    throw new NotFoundException(`Suscripción ${id} no encontrada`);
  }

  async updateSubscription(id: number, data: any) {
    const mg = this.managerGymId();
    const s = await this.findOneSubscription(id);
    if (
      mg !== null &&
      data?.homeGymId !== undefined &&
      data?.homeGymId !== null &&
      Number(data.homeGymId) !== mg
    ) {
      throw new ForbiddenException(
        'No puede mover la suscripción a otra sucursal',
      );
    }
    Object.assign(s, data);
    return this.subsRepo.save(s);
  }

  createPayment(data: any) {
    return this.paymentsRepo.save(this.paymentsRepo.create(data));
  }

  async findPaymentsBySubscription(subscriptionId: number) {
    await this.findOneSubscription(subscriptionId);
    return this.paymentsRepo.find({
      where: { subscriptionId },
      order: { paymentDate: 'DESC' },
      take: 50,
    });
  }
}
