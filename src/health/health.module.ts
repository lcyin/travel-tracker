import { Module } from '@nestjs/common';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [TypeOrmHealthIndicator],
})
export class HealthModule {}
