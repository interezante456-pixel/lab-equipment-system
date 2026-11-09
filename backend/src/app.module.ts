import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReturnsPenaltiesModule } from './returns-penalties/returns-penalties.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    EquipmentModule,
    ReservationsModule,
    ReturnsPenaltiesModule,
    NotificationsModule,
    DashboardModule,
  ],
})
export class AppModule {}
