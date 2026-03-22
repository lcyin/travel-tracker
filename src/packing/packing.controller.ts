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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingService } from './packing.service';

@ApiTags('Packing')
@ApiBearerAuth('access-token')
@Controller('trips/:tripId/packing')
@UseGuards(JwtAuthGuard)
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @ApiOperation({ summary: 'List packing items for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @Get()
  findAll(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.packingService.findAll(tripId);
  }

  @ApiOperation({ summary: 'Create a packing item for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createPackingItemDto: CreatePackingItemDto,
  ) {
    return this.packingService.create(tripId, createPackingItemDto);
  }

  @ApiOperation({ summary: 'Update a packing item' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Packing item ID (UUID)' })
  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePackingItemDto: UpdatePackingItemDto,
  ) {
    return this.packingService.update(tripId, id, updatePackingItemDto);
  }

  @ApiOperation({ summary: 'Delete a packing item' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Packing item ID (UUID)' })
  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.packingService.remove(tripId, id);
  }
}
