import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { TripsGroupedResponseDto } from './dto/trips-grouped-response.dto';
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

  async findGrouped(userId: string): Promise<TripsGroupedResponseDto> {
    const trips = await this.findAll(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped = trips.reduce<TripsGroupedResponseDto>(
      (acc, trip) => {
        const isPast =
          typeof trip.endDate === 'string' &&
          new Date(trip.endDate).getTime() < today.getTime();

        if (isPast) {
          acc.past.push(trip);
        } else {
          acc.upcoming.push(trip);
        }

        return acc;
      },
      {
        upcoming: [],
        past: [],
      },
    );

    return grouped;
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
    this.validateDateRange(createTripDto.startDate, createTripDto.endDate);

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

    this.validateDateRange(
      updateTripDto.startDate ?? existingTrip.startDate,
      updateTripDto.endDate ?? existingTrip.endDate,
    );

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
      tripType: trip.tripType,
      status: trip.status,
      userId: trip.userId,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }

  private validateDateRange(startDate?: string, endDate?: string): void {
    if (!startDate || !endDate) {
      return;
    }

    const startDateTimestamp = new Date(startDate).getTime();
    const endDateTimestamp = new Date(endDate).getTime();

    if (endDateTimestamp <= startDateTimestamp) {
      throw new BadRequestException('endDate must be after startDate');
    }
  }
}
