import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackingController } from './packing.controller';
import { PackingItem } from './entities/packing-item.entity';
import { PackingService } from './packing.service';

@Module({
  imports: [TypeOrmModule.forFeature([PackingItem])],
  controllers: [PackingController],
  providers: [PackingService],
})
export class PackingModule {}
