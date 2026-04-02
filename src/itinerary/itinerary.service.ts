import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { TripsService } from '../trips/trips.service';
import { CreateItineraryItemDto } from './dto/create-itinerary-item.dto';
import { ItineraryDayResponseDto } from './dto/itinerary-day-response.dto';
import { ItineraryItemResponseDto } from './dto/itinerary-item-response.dto';
import { UpdateItineraryItemDto } from './dto/update-itinerary-item.dto';
import { ItineraryDay } from './entities/itinerary-day.entity';
import { ItineraryItem } from './entities/itinerary-item.entity';
import { ItineraryItemStatus } from './enums/itinerary-item.enums';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(ItineraryDay)
    private readonly dayRepository: Repository<ItineraryDay>,
    @InjectRepository(ItineraryItem)
    private readonly itemRepository: Repository<ItineraryItem>,
    private readonly tripsService: TripsService,
  ) {}

  async getItinerary(
    tripId: string,
    userId: string,
  ): Promise<ItineraryDayResponseDto[]> {
    // Validates ownership and throws NotFoundException if not found
    const trip = await this.tripsService.findOne(tripId, userId);

    // Auto-generate one ItineraryDay per date in the trip's date range
    if (trip.startDate && trip.endDate) {
      const dates = this.getDateRange(trip.startDate, trip.endDate);
      for (const date of dates) {
        await this.dayRepository
          .createQueryBuilder()
          .insert()
          .into(ItineraryDay)
          .values({ tripId, date })
          .orIgnore()
          .execute();
      }
    }

    const days = await this.dayRepository.find({
      where: { tripId },
      relations: ['items'],
      order: { date: 'ASC' },
    });

    return days.map((day) => this.toDayResponse(day));
  }

  async getDayItems(
    dayId: string,
    userId: string,
  ): Promise<ItineraryItemResponseDto[]> {
    const day = await this.dayRepository.findOne({
      where: { id: dayId },
      relations: ['trip'],
    });

    if (!day || day.trip.userId !== userId) {
      throw new NotFoundException('Itinerary day not found');
    }

    const items = await this.itemRepository.find({
      where: { dayId },
      order: { startTime: 'ASC', orderIndex: 'ASC' },
    });

    return items.map((item) => this.toItemResponse(item));
  }

  async createItem(
    dayId: string,
    dto: CreateItineraryItemDto,
    userId: string,
  ): Promise<ItineraryItemResponseDto> {
    const day = await this.dayRepository.findOne({
      where: { id: dayId },
      relations: ['trip'],
    });

    if (!day || day.trip.userId !== userId) {
      throw new NotFoundException('Itinerary day not found');
    }

    const item = this.itemRepository.create({
      ...dto,
      dayId,
      status: dto.status ?? ItineraryItemStatus.Planned,
    });

    const saved = await this.itemRepository.save(item);
    return this.toItemResponse(saved);
  }

  async updateItem(
    id: string,
    dto: UpdateItineraryItemDto,
    userId: string,
  ): Promise<ItineraryItemResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['day', 'day.trip'],
    });

    if (!item || item.day.trip.userId !== userId) {
      throw new NotFoundException('Itinerary item not found');
    }

    Object.assign(item, dto);
    const saved = await this.itemRepository.save(item);
    return this.toItemResponse(saved);
  }

  async deleteItem(id: string, userId: string): Promise<DeleteResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['day', 'day.trip'],
    });

    if (!item || item.day.trip.userId !== userId) {
      throw new NotFoundException('Itinerary item not found');
    }

    await this.itemRepository.softDelete(id);
    return { deleted: true, id };
  }

  private getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private toItemResponse(item: ItineraryItem): ItineraryItemResponseDto {
    return {
      id: item.id,
      dayId: item.dayId,
      type: item.type,
      title: item.title,
      notes: item.notes,
      startTime: item.startTime,
      endTime: item.endTime,
      orderIndex: item.orderIndex,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toDayResponse(day: ItineraryDay): ItineraryDayResponseDto {
    const sortedItems = (day.items ?? [])
      .slice()
      .sort((a, b) => {
        if (!a.startTime && !b.startTime)
          return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        if (a.startTime !== b.startTime)
          return a.startTime.localeCompare(b.startTime);
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      })
      .map((item) => this.toItemResponse(item));

    return {
      id: day.id,
      tripId: day.tripId,
      date: day.date,
      items: sortedItems,
      createdAt: day.createdAt,
      updatedAt: day.updatedAt,
    };
  }
}
