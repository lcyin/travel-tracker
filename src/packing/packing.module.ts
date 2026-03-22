import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { PackingController } from './packing.controller';
import { PackingItem } from './entities/packing-item.entity';
import { PackingService } from './packing.service';
import { PackingSuggestionsService } from './services/packing-suggestions.service';

@Module({
  imports: [TypeOrmModule.forFeature([PackingItem, Trip])],
  controllers: [PackingController],
  providers: [PackingService, PackingSuggestionsService],
})
export class PackingModule {}
