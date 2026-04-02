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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateItineraryItemDto } from './dto/create-itinerary-item.dto';
import { ItineraryDayResponseDto } from './dto/itinerary-day-response.dto';
import { ItineraryItemResponseDto } from './dto/itinerary-item-response.dto';
import { UpdateItineraryItemDto } from './dto/update-itinerary-item.dto';
import { ItineraryService } from './itinerary.service';

@ApiTags('Itinerary')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @ApiOperation({
    summary:
      'Get full itinerary for a trip, auto-generating days from the trip date range',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: ItineraryDayResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('trips/:tripId/itinerary')
  getItinerary(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ItineraryDayResponseDto[]> {
    return this.itineraryService.getItinerary(tripId, user.sub);
  }

  @ApiOperation({ summary: 'Get all items for a specific itinerary day' })
  @ApiParam({ name: 'dayId', description: 'Itinerary day ID (UUID)' })
  @ApiOkResponse({ type: ItineraryItemResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Itinerary day not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('itinerary-days/:dayId/items')
  getDayItems(
    @Param('dayId', ParseUUIDPipe) dayId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ItineraryItemResponseDto[]> {
    return this.itineraryService.getDayItems(dayId, user.sub);
  }

  @ApiOperation({ summary: 'Add an item to an itinerary day' })
  @ApiParam({ name: 'dayId', description: 'Itinerary day ID (UUID)' })
  @ApiCreatedResponse({ type: ItineraryItemResponseDto })
  @ApiNotFoundResponse({ description: 'Itinerary day not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post('itinerary-days/:dayId/items')
  createItem(
    @Param('dayId', ParseUUIDPipe) dayId: string,
    @Body() dto: CreateItineraryItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ItineraryItemResponseDto> {
    return this.itineraryService.createItem(dayId, dto, user.sub);
  }

  @ApiOperation({ summary: 'Update an itinerary item' })
  @ApiParam({ name: 'id', description: 'Itinerary item ID (UUID)' })
  @ApiOkResponse({ type: ItineraryItemResponseDto })
  @ApiNotFoundResponse({ description: 'Itinerary item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Patch('itinerary-items/:id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItineraryItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ItineraryItemResponseDto> {
    return this.itineraryService.updateItem(id, dto, user.sub);
  }

  @ApiOperation({ summary: 'Soft-delete an itinerary item' })
  @ApiParam({ name: 'id', description: 'Itinerary item ID (UUID)' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiNotFoundResponse({ description: 'Itinerary item not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete('itinerary-items/:id')
  deleteItem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<DeleteResponseDto> {
    return this.itineraryService.deleteItem(id, user.sub);
  }
}
