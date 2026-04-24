"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const gyms_module_1 = require("./gyms/gyms.module");
const activities_module_1 = require("./activities/activities.module");
const exercises_module_1 = require("./exercises/exercises.module");
const routines_module_1 = require("./routines/routines.module");
const training_module_1 = require("./training/training.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const reservations_module_1 = require("./reservations/reservations.module");
const waitlist_module_1 = require("./waitlist/waitlist.module");
const checkins_module_1 = require("./checkins/checkins.module");
const metrics_module_1 = require("./metrics/metrics.module");
const notifications_module_1 = require("./notifications/notifications.module");
const system_module_1 = require("./system/system.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'postgres',
                    host: cfg.get('DB_HOST'),
                    port: cfg.get('DB_PORT'),
                    username: cfg.get('DB_USERNAME'),
                    password: cfg.get('DB_PASSWORD'),
                    database: cfg.get('DB_DATABASE'),
                    autoLoadEntities: true,
                    synchronize: cfg.get('NODE_ENV') !== 'production',
                    dropSchema: cfg.get('DROP_SCHEMA') === 'true',
                    logging: true,
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            gyms_module_1.GymsModule,
            activities_module_1.ActivitiesModule,
            exercises_module_1.ExercisesModule,
            routines_module_1.RoutinesModule,
            training_module_1.TrainingModule,
            subscriptions_module_1.SubscriptionsModule,
            reservations_module_1.ReservationsModule,
            waitlist_module_1.WaitlistModule,
            checkins_module_1.CheckinsModule,
            metrics_module_1.MetricsModule,
            notifications_module_1.NotificationsModule,
            system_module_1.SystemModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map