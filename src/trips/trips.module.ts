import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripTask } from '../checklist/entities/trip-task.entity';
import { ChecklistModule } from '../checklist/checklist.module';
import { TripsController } from './trips.controller';
import { Trip } from './entities/trip.entity';
import { TripsService } from './trips.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripTask]), ChecklistModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
