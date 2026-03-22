import { PartialType } from '@nestjs/mapped-types';
import { CreatePackingItemDto } from './create-packing-item.dto';

export class UpdatePackingItemDto extends PartialType(CreatePackingItemDto) {}
