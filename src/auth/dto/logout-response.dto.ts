import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Whether the current session was logged out successfully',
    example: true,
  })
  loggedOut!: boolean;
}
