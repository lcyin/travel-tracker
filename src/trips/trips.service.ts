import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {}

  findAll(userId: string) {
    return this.tripsRepository.find({
      where: { userId },
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string, userId: string) {
    const trip = await this.tripsRepository.findOne({ where: { id, userId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async create(userId: string, createTripDto: CreateTripDto) {
    const trip = this.tripsRepository.create({
      ...createTripDto,
      userId,
    });

    return this.tripsRepository.save(trip);
  }

  async update(id: string, userId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.findOne(id, userId);
    Object.assign(trip, updateTripDto);
    return this.tripsRepository.save(trip);
  }

  async remove(id: string, userId: string) {
    const trip = await this.findOne(id, userId);
    await this.tripsRepository.remove(trip);

    return { deleted: true, id };
  }
}
