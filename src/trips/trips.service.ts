import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripTask } from '../checklist/entities/trip-task.entity';
import { TaskGeneratorService } from '../checklist/services/task-generator.service';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { NextPendingTaskDto } from './dto/trip-dashboard-response.dto';
import { QuickLinksDto } from './dto/trip-dashboard-response.dto';
import { TaskProgressDto } from './dto/trip-dashboard-response.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { TripDashboardResponseDto } from './dto/trip-dashboard-response.dto';
import { TripsGroupedResponseDto } from './dto/trips-grouped-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripTask)
    private readonly taskRepository: Repository<TripTask>,
    private readonly taskGeneratorService: TaskGeneratorService,
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

  async findDashboard(
    id: string,
    userId: string,
  ): Promise<TripDashboardResponseDto> {
    const trip = await this.tripsRepository.findOne({ where: { id, userId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const tasks = await this.taskRepository.find({
      where: { tripId: id },
      order: { dueDate: 'ASC' },
    });

    const completed = tasks.filter((t) => t.isCompleted).length;
    const total = tasks.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const pendingTasks = tasks.filter((t) => !t.isCompleted);
    const nextPendingTask =
      pendingTasks.length > 0
        ? this.toNextPendingTaskDto(pendingTasks[0])
        : undefined;

    return {
      trip: this.toTripResponse(trip),
      progress: {
        completed,
        total,
        percentage,
      },
      nextPendingTask,
      quickLinks: {
        checklist: `/trips/${id}/tasks`,
        packing: `/trips/${id}/packing`,
        itinerary: `/trips/${id}/itinerary`,
        documents: `/trips/${id}/documents`,
      },
    };
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

    // Generate default pre-trip tasks asynchronously (don't block on errors)
    await this.taskGeneratorService.generateDefaultTasks(
      savedTrip.id,
      savedTrip.startDate,
    );

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

  private toNextPendingTaskDto(task: TripTask): NextPendingTaskDto {
    return {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
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
