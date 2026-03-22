import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { ChecklistGroupedResponseDto } from './dto/checklist-grouped-response.dto';
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

  async findGrouped(tripId: string): Promise<ChecklistGroupedResponseDto> {
    const allTasks = await this.tripTasksRepository.find({
      where: { tripId },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const isOverdue = (t: TripTask): boolean =>
      !t.isCompleted && !!t.dueDate && t.dueDate < now;

    const sortByDueDate = (a: TripTask, b: TripTask): number => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    };

    const overdue = allTasks
      .filter((t) => isOverdue(t))
      .sort(sortByDueDate)
      .map((t) => this.toTripTaskResponse(t));

    const pending = allTasks
      .filter((t) => !t.isCompleted && !isOverdue(t))
      .sort(sortByDueDate)
      .map((t) => this.toTripTaskResponse(t));

    const done = allTasks
      .filter((t) => t.isCompleted)
      .sort(sortByDueDate)
      .map((t) => this.toTripTaskResponse(t));

    return { overdue, pending, done };
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
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isOverdue =
      !tripTask.isCompleted && !!tripTask.dueDate && tripTask.dueDate < now;

    return {
      id: tripTask.id,
      title: tripTask.title,
      isCompleted: tripTask.isCompleted,
      isOverdue,
      dueDate: tripTask.dueDate,
      priority: tripTask.priority,
      category: tripTask.category,
      notes: tripTask.notes,
      tripId: tripTask.tripId,
      createdAt: tripTask.createdAt,
      updatedAt: tripTask.updatedAt,
    };
  }
}
