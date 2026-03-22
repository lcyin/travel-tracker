import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {}

  async findAll(userId: string): Promise<TripResponseDto[]> {
    const trips = await this.tripsRepository.find({
      where: { userId },
      order: { startDate: 'ASC' },
    });

    return trips.map((trip) => this.toTripResponse(trip));
  }

  async findOne(id: string, userId: string): Promise<TripResponseDto> {
    const trip = await this.tripsRepository.findOne({ where: { id, userId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return this.toTripResponse(trip);
  }

  async create(
    userId: string,
    createTripDto: CreateTripDto,
  ): Promise<TripResponseDto> {
    const trip = this.tripsRepository.create({
      ...createTripDto,
      userId,
    });

    const savedTrip = await this.tripsRepository.save(trip);
    return this.toTripResponse(savedTrip);
  }

  async update(
    id: string,
    userId: string,
    updateTripDto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    const existingTrip = await this.tripsRepository.findOne({
      where: { id, userId },
    });

    if (!existingTrip) {
      throw new NotFoundException('Trip not found');
    }

    Object.assign(existingTrip, updateTripDto);
    const updatedTrip = await this.tripsRepository.save(existingTrip);
    return this.toTripResponse(updatedTrip);
  }

  async remove(id: string, userId: string): Promise<DeleteResponseDto> {
    const trip = await this.tripsRepository.findOne({ where: { id, userId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    await this.tripsRepository.remove(trip);

    return { deleted: true, id };
  }

  private toTripResponse(trip: Trip): TripResponseDto {
    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      userId: trip.userId,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }
}
