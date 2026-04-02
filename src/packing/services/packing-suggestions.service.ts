import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { TripClimate, TripType } from '../../trips/enums/trip.enums';
import { AcceptPackingSuggestionsDto } from '../dto/accept-packing-suggestions.dto';
import {
  PackingSuggestionItemDto,
  PackingSuggestionsResponseDto,
} from '../dto/packing-suggestions-response.dto';
import { PackingItemResponseDto } from '../dto/packing-item-response.dto';
import { PackingItem } from '../entities/packing-item.entity';
import {
  buildPackingSuggestions,
  PACKING_CATEGORIES,
  PackingSuggestionTemplate,
} from '../constants/packing-suggestions';

@Injectable()
export class PackingSuggestionsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(PackingItem)
    private readonly packingItemsRepository: Repository<PackingItem>,
  ) {}

  async getSuggestions(
    tripId: string,
    userId: string,
  ): Promise<PackingSuggestionsResponseDto> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId, userId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const durationDays = this.calculateDuration(trip.startDate, trip.endDate);
    const tripType: TripType = trip.tripType ?? TripType.Leisure;
    const climate = trip.climate;
    const suggestions = buildPackingSuggestions(
      tripType,
      climate,
      durationDays,
    );

    const grouped = this.groupSuggestions(suggestions);
    const total = suggestions.length;

    return { suggestions: grouped, total };
  }

  async acceptSuggestions(
    tripId: string,
    userId: string,
    dto: AcceptPackingSuggestionsDto,
  ): Promise<PackingItemResponseDto[]> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId, userId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const durationDays = this.calculateDuration(trip.startDate, trip.endDate);
    const tripType: TripType = trip.tripType ?? TripType.Leisure;
    const climate = trip.climate;
    const allSuggestions = buildPackingSuggestions(
      tripType,
      climate,
      durationDays,
    );

    // Build key lookup map
    const keyMap = new Map<string, PackingSuggestionTemplate>(
      allSuggestions.map((s) => [`${s.category}::${s.name}`, s]),
    );

    const acceptedTemplates = dto.keys
      .map((key) => keyMap.get(key))
      .filter((s): s is PackingSuggestionTemplate => s !== undefined);

    if (acceptedTemplates.length === 0) {
      return [];
    }

    const items = acceptedTemplates.map((template) =>
      this.packingItemsRepository.create({
        name: template.name,
        category: template.category,
        quantity: template.quantity,
        isPacked: false,
        tripId,
      }),
    );

    const saved = await this.packingItemsRepository.save(items);
    return saved.map((item) => this.toResponse(item));
  }

  private calculateDuration(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) return 3; // default: short trip
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }

  private groupSuggestions(
    suggestions: PackingSuggestionTemplate[],
  ): Record<string, PackingSuggestionItemDto[]> {
    const grouped: Record<string, PackingSuggestionItemDto[]> =
      Object.fromEntries(
        Object.values(PACKING_CATEGORIES).map((cat) => [cat, []]),
      );

    for (const s of suggestions) {
      const bucket = grouped[s.category] ?? [];
      bucket.push({
        key: `${s.category}::${s.name}`,
        name: s.name,
        category: s.category,
        quantity: s.quantity,
      });
      grouped[s.category] = bucket;
    }

    return grouped;
  }

  private toResponse(item: PackingItem): PackingItemResponseDto {
    return {
      id: item.id,
      name: item.name,
      isPacked: item.isPacked,
      quantity: item.quantity,
      category: item.category,
      tripId: item.tripId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
