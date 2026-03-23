import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { PackingFiltersQueryDto } from './dto/packing-filters-query.dto';
import { PackingItemResponseDto } from './dto/packing-item-response.dto';
import { PackingProgressResponseDto } from './dto/packing-progress-response.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingItem } from './entities/packing-item.entity';

@Injectable()
export class PackingService {
  constructor(
    @InjectRepository(PackingItem)
    private readonly packingItemsRepository: Repository<PackingItem>,
  ) {}

  async findAll(
    tripId: string,
    filters?: PackingFiltersQueryDto,
  ): Promise<PackingItemResponseDto[]> {
    const where: {
      tripId: string;
      category?: string;
      isPacked?: boolean;
    } = { tripId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (typeof filters?.isPacked === 'string') {
      where.isPacked = filters.isPacked === 'true';
    }

    const packingItems = await this.packingItemsRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });

    return packingItems.map((packingItem) =>
      this.toPackingItemResponse(packingItem),
    );
  }

  async getProgress(tripId: string): Promise<PackingProgressResponseDto> {
    const packingItems = await this.packingItemsRepository.find({
      where: { tripId },
      select: ['id', 'isPacked'],
    });

    const total = packingItems.length;
    const packed = packingItems.filter((item) => item.isPacked).length;
    const percentage = total === 0 ? 0 : Math.round((packed / total) * 100);

    return {
      packed,
      total,
      percentage,
    };
  }

  async create(
    tripId: string,
    createPackingItemDto: CreatePackingItemDto,
  ): Promise<PackingItemResponseDto> {
    const packingItem = this.packingItemsRepository.create({
      ...createPackingItemDto,
      tripId,
    });

    const savedPackingItem =
      await this.packingItemsRepository.save(packingItem);
    return this.toPackingItemResponse(savedPackingItem);
  }

  async update(
    tripId: string,
    id: string,
    updatePackingItemDto: UpdatePackingItemDto,
  ): Promise<PackingItemResponseDto> {
    const packingItem = await this.packingItemsRepository.findOne({
      where: { id, tripId },
    });

    if (!packingItem) {
      throw new NotFoundException('Packing item not found');
    }

    Object.assign(packingItem, updatePackingItemDto);
    const updatedPackingItem =
      await this.packingItemsRepository.save(packingItem);
    return this.toPackingItemResponse(updatedPackingItem);
  }

  async remove(tripId: string, id: string): Promise<DeleteResponseDto> {
    const packingItem = await this.packingItemsRepository.findOne({
      where: { id, tripId },
    });

    if (!packingItem) {
      throw new NotFoundException('Packing item not found');
    }

    await this.packingItemsRepository.remove(packingItem);

    return { deleted: true, id };
  }

  private toPackingItemResponse(
    packingItem: PackingItem,
  ): PackingItemResponseDto {
    return {
      id: packingItem.id,
      name: packingItem.name,
      isPacked: packingItem.isPacked,
      quantity: packingItem.quantity,
      category: packingItem.category,
      tripId: packingItem.tripId,
      createdAt: packingItem.createdAt,
      updatedAt: packingItem.updatedAt,
    };
  }
}
