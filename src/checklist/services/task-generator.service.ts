import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripTask } from '../entities/trip-task.entity';
import { DEFAULT_TRIP_TASKS } from '../constants/default-tasks';

@Injectable()
export class TaskGeneratorService {
  private readonly logger = new Logger(TaskGeneratorService.name);

  constructor(
    @InjectRepository(TripTask)
    private readonly tripTaskRepository: Repository<TripTask>,
  ) {}

  /**
   * Generate default pre-trip tasks for a new trip
   * @param tripId Trip ID
   * @param tripStartDate Trip start date (ISO string or Date object)
   */
  async generateDefaultTasks(
    tripId: string,
    tripStartDate?: string | Date,
  ): Promise<void> {
    try {
      // Skip generation if no start date provided
      if (!tripStartDate) {
        this.logger.debug(
          `Skipping task generation for trip ${tripId}: no start date provided`,
        );
        return;
      }

      const startDate = new Date(tripStartDate);
      if (isNaN(startDate.getTime())) {
        this.logger.warn(
          `Invalid start date for trip ${tripId}: ${tripStartDate}`,
        );
        return;
      }

      // Generate tasks with calculated due dates
      const tasks = DEFAULT_TRIP_TASKS.map((template) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() - template.daysBeforeStart);

        return this.tripTaskRepository.create({
          title: template.title,
          category: template.category,
          priority: template.priority,
          tripId,
          dueDate,
          isCompleted: false,
        });
      });

      await this.tripTaskRepository.save(tasks);
      this.logger.log(
        `Generated ${tasks.length} default tasks for trip ${tripId}`,
      );
    } catch (error) {
      // Log error but don't throw - trip creation should not fail if task generation fails
      this.logger.error(
        `Failed to generate default tasks for trip ${tripId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
