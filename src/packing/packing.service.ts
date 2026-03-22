import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingItem } from './entities/packing-item.entity';

@Injectable()
export class PackingService {
  constructor(
    @InjectRepository(PackingItem)
    private readonly packingItemsRepository: Repository<PackingItem>,
  ) {}

  findAll(tripId: string) {
    return this.packingItemsRepository.find({
      where: { tripId },
      order: { createdAt: 'ASC' },
    });
  }

  create(tripId: string, createPackingItemDto: CreatePackingItemDto) {
    const packingItem = this.packingItemsRepository.create({
      ...createPackingItemDto,
      tripId,
    });

    return this.packingItemsRepository.save(packingItem);
  }

  async update(
    tripId: string,
    id: string,
    updatePackingItemDto: UpdatePackingItemDto,
  ) {
    const packingItem = await this.packingItemsRepository.findOne({
      where: { id, tripId },
    });

    if (!packingItem) {
      throw new NotFoundException('Packing item not found');
    }

    Object.assign(packingItem, updatePackingItemDto);
    return this.packingItemsRepository.save(packingItem);
  }

  async remove(tripId: string, id: string) {
    const packingItem = await this.packingItemsRepository.findOne({
      where: { id, tripId },
    });

    if (!packingItem) {
      throw new NotFoundException('Packing item not found');
    }

    await this.packingItemsRepository.remove(packingItem);

    return { deleted: true, id };
  }
}
