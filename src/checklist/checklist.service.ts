import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { TripTaskResponseDto } from './dto/trip-task-response.dto';
import { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import { TripTask } from './entities/trip-task.entity';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(TripTask)
    private readonly tripTasksRepository: Repository<TripTask>,
  ) {}

  async findAll(tripId: string): Promise<TripTaskResponseDto[]> {
    const tripTasks = await this.tripTasksRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });

    return tripTasks.map((tripTask) => this.toTripTaskResponse(tripTask));
  }

  async create(
    tripId: string,
    createTripTaskDto: CreateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const tripTask = this.tripTasksRepository.create({
      ...createTripTaskDto,
      dueDate: createTripTaskDto.dueDate
        ? new Date(createTripTaskDto.dueDate)
        : undefined,
      tripId,
    });

    const savedTripTask = await this.tripTasksRepository.save(tripTask);
    return this.toTripTaskResponse(savedTripTask);
  }

  async update(
    tripId: string,
    id: string,
    updateTripTaskDto: UpdateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    const tripTask = await this.tripTasksRepository.findOne({
      where: { id, tripId },
    });

    if (!tripTask) {
      throw new NotFoundException('Trip task not found');
    }

    Object.assign(tripTask, {
      ...updateTripTaskDto,
      dueDate: updateTripTaskDto.dueDate
        ? new Date(updateTripTaskDto.dueDate)
        : tripTask.dueDate,
    });

    const updatedTripTask = await this.tripTasksRepository.save(tripTask);
    return this.toTripTaskResponse(updatedTripTask);
  }

  async remove(tripId: string, id: string): Promise<DeleteResponseDto> {
    const tripTask = await this.tripTasksRepository.findOne({
      where: { id, tripId },
    });

    if (!tripTask) {
      throw new NotFoundException('Trip task not found');
    }

    await this.tripTasksRepository.remove(tripTask);

    return { deleted: true, id };
  }

  private toTripTaskResponse(tripTask: TripTask): TripTaskResponseDto {
    return {
      id: tripTask.id,
      title: tripTask.title,
      isCompleted: tripTask.isCompleted,
      dueDate: tripTask.dueDate,
      priority: tripTask.priority,
      category: tripTask.category,
      tripId: tripTask.tripId,
      createdAt: tripTask.createdAt,
      updatedAt: tripTask.updatedAt,
    };
  }
}
