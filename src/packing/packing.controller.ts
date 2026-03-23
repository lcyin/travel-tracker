import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { AcceptPackingSuggestionsDto } from './dto/accept-packing-suggestions.dto';
import { CreatePackingItemDto } from './dto/create-packing-item.dto';
import { PackingFiltersQueryDto } from './dto/packing-filters-query.dto';
import { PackingItemResponseDto } from './dto/packing-item-response.dto';
import { PackingProgressResponseDto } from './dto/packing-progress-response.dto';
import { PackingSuggestionsResponseDto } from './dto/packing-suggestions-response.dto';
import { UpdatePackingItemDto } from './dto/update-packing-item.dto';
import { PackingService } from './packing.service';
import { PackingSuggestionsService } from './services/packing-suggestions.service';

@ApiTags('Packing')
@ApiBearerAuth('access-token')
@Controller('trips/:tripId/packing')
@UseGuards(JwtAuthGuard)
export class PackingController {
  constructor(
    private readonly packingService: PackingService,
    private readonly packingSuggestionsService: PackingSuggestionsService,
  ) {}

  @ApiOperation({ summary: 'List packing items for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'isPacked',
    required: false,
    description: 'Filter by packed status (true/false)',
  })
  @ApiOkResponse({ type: PackingItemResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Query() query: PackingFiltersQueryDto,
  ): Promise<PackingItemResponseDto[]> {
    return this.packingService.findAll(tripId, query);
  }

  @ApiOperation({ summary: 'Get packing progress summary for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: PackingProgressResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('progress')
  getProgress(
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<PackingProgressResponseDto> {
    return this.packingService.getProgress(tripId);
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

  @ApiOperation({
    summary:
      'Get AI-suggested packing items based on trip type, climate, and duration',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: PackingSuggestionsResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('suggestions')
  getSuggestions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<PackingSuggestionsResponseDto> {
    return this.packingSuggestionsService.getSuggestions(tripId, user.sub);
  }

  @ApiOperation({
    summary:
      'Accept selected packing suggestions and add them to the trip packing list',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiCreatedResponse({ type: PackingItemResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post('suggestions/accept')
  acceptSuggestions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: AcceptPackingSuggestionsDto,
  ): Promise<PackingItemResponseDto[]> {
    return this.packingSuggestionsService.acceptSuggestions(
      tripId,
      user.sub,
      dto,
    );
  }
}
