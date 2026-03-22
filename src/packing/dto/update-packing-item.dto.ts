import { PartialType } from '@nestjs/swagger';
import { CreatePackingItemDto } from './create-packing-item.dto';

export class UpdatePackingItemDto extends PartialType(CreatePackingItemDto) {}
