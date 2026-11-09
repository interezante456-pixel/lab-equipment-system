import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ReturnsPenaltiesService } from './returns-penalties.service';
import { LiftPenaltyDto } from './dto/lift-penalty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('returns-penalties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsPenaltiesController {
  constructor(private readonly service: ReturnsPenaltiesService) {}

  @Patch('dispatch/:reservationId')
  @Roles(Role.ADMIN)
  dispatch(@Param('reservationId') reservationId: string) {
    return this.service.dispatch(reservationId);
  }

  @Patch('return/:reservationId')
  @Roles(Role.ADMIN)
  processReturn(@Param('reservationId') reservationId: string) {
    return this.service.processReturn(reservationId);
  }

  @Get('penalties')
  @Roles(Role.ADMIN)
  findAllPenalties() {
    return this.service.findAllPenalties();
  }

  @Patch('penalties/:id/lift')
  @Roles(Role.ADMIN)
  liftPenalty(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: LiftPenaltyDto,
  ) {
    return this.service.liftPenalty(id, admin.fullName, dto);
  }
}
