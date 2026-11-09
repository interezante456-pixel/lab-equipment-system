import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RejectReservationDto } from './dto/reject-reservation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, ReservationStatus } from '@prisma/client';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(user.id, createReservationDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: ReservationStatus) {
    // Si es estudiante, solo ve sus reservas; si es admin, puede ver todas
    const filterUserId = user.role === Role.ADMIN ? undefined : user.id;
    return this.reservationsService.findAll(status, filterUserId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findPending() {
    return this.reservationsService.findPending();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.reservationsService.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string, @Body() rejectDto: RejectReservationDto) {
    return this.reservationsService.reject(id, rejectDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reservationsService.cancelByStudent(id, user.id);
  }
}
