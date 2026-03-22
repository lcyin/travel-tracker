import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { TripTask } from './entities/trip-task.entity';
import { ChecklistService } from './checklist.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripTask])],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
