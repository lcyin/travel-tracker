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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { PackingItemResponseDto } from './dto/packing-item-response.dto';
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
  @ApiOkResponse({ type: PackingItemResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<PackingItemResponseDto[]> {
    return this.packingService.findAll(tripId);
  }

  @ApiOperation({ summary: 'Create a packing item for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiCreatedResponse({ type: PackingItemResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createPackingItemDto: CreatePackingItemDto,
  ): Promise<PackingItemResponseDto> {
    return this.packingService.create(tripId, createPackingItemDto);
  }

  @ApiOperation({ summary: 'Update a packing item' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Packing item ID (UUID)' })
  @ApiOkResponse({ type: PackingItemResponseDto })
  @ApiNotFoundResponse({ description: 'Packing item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePackingItemDto: UpdatePackingItemDto,
  ): Promise<PackingItemResponseDto> {
    return this.packingService.update(tripId, id, updatePackingItemDto);
  }

  @ApiOperation({ summary: 'Delete a packing item' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Packing item ID (UUID)' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiNotFoundResponse({ description: 'Packing item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteResponseDto> {
    return this.packingService.remove(tripId, id);
  }
}
