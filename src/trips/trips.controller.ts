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
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiOperation({ summary: 'List current user trips' })
  @ApiOkResponse({ type: TripResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload): Promise<TripResponseDto[]> {
    return this.tripsService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: TripResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripResponseDto> {
    return this.tripsService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Create a new trip' })
  @ApiCreatedResponse({ type: TripResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createTripDto: CreateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.create(user.sub, createTripDto);
  }

  @ApiOperation({ summary: 'Update an existing trip' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: TripResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.update(id, user.sub, updateTripDto);
  }

  @ApiOperation({ summary: 'Delete a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteResponseDto> {
    return this.tripsService.remove(id, user.sub);
  }
}
