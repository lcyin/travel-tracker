import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { PackingItemResponseDto } from './dto/packing-item-response.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingItem } from './entities/packing-item.entity';

@Injectable()
export class PackingService {
  constructor(
    @InjectRepository(PackingItem)
    private readonly packingItemsRepository: Repository<PackingItem>,
  ) {}

  async findAll(tripId: string): Promise<PackingItemResponseDto[]> {
    const packingItems = await this.packingItemsRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });

    return packingItems.map((packingItem) =>
      this.toPackingItemResponse(packingItem),
    );
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
