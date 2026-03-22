import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingService } from './packing.service';

@Controller('trips/:tripId/packing')
@UseGuards(JwtAuthGuard)
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Get()
  findAll(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.packingService.findAll(tripId);
  }

  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createPackingItemDto: CreatePackingItemDto,
  ) {
    return this.packingService.create(tripId, createPackingItemDto);
  }

  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePackingItemDto: UpdatePackingItemDto,
  ) {
    return this.packingService.update(tripId, id, updatePackingItemDto);
  }

  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.packingService.remove(tripId, id);
  }
}
