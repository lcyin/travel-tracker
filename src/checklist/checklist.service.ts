import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import { TripTask } from './entities/trip-task.entity';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(TripTask)
    private readonly tripTasksRepository: Repository<TripTask>,
  ) {}

  findAll(tripId: string) {
    return this.tripTasksRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(tripId: string, createTripTaskDto: CreateTripTaskDto) {
    const tripTask = this.tripTasksRepository.create({
      ...createTripTaskDto,
      dueDate: createTripTaskDto.dueDate
        ? new Date(createTripTaskDto.dueDate)
        : undefined,
      tripId,
    });

    return this.tripTasksRepository.save(tripTask);
  }

  async update(
    tripId: string,
    id: string,
    updateTripTaskDto: UpdateTripTaskDto,
  ) {
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

    return this.tripTasksRepository.save(tripTask);
  }

  async remove(tripId: string, id: string) {
    const tripTask = await this.tripTasksRepository.findOne({
      where: { id, tripId },
    });

    if (!tripTask) {
      throw new NotFoundException('Trip task not found');
    }

    await this.tripTasksRepository.remove(tripTask);

    return { deleted: true, id };
  }
}
