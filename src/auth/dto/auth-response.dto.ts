import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: 'a9b07db3-becf-4f7c-b627-2d56f68ca2dc',
  })
  id!: string;

  @ApiProperty({
    description: 'User email',
    example: 'traveler@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'Kevin',
  })
  displayName?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-22T09:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-03-22T09:30:00.000Z',
  })
  updatedAt!: Date;
}

export class TokenPairResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.signature',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature',
  })
  refreshToken!: string;
}

export class AuthResponseDto extends TokenPairResponseDto {
  @ApiProperty({
    description: 'Authenticated user profile',
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}
