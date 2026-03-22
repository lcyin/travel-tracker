import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import {
  AuthResponseDto,
  TokenPairResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';

type RefreshTokenPayload = {
  sub: string;
  email: string;
  jti: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      email: registerDto.email,
      passwordHash,
      displayName: registerDto.displayName,
    });

    const savedUser = await this.usersRepository.save(user);
    const tokens = await this.issueTokens(savedUser);

    return {
      user: this.toSafeUser(savedUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    return {
      user: this.toSafeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPairResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      const refreshTokenRecord = await this.refreshTokensRepository.findOne({
        where: { jti: payload.jti, userId: payload.sub },
      });

      if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (refreshTokenRecord.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      const tokenMatches = await bcrypt.compare(
        refreshToken,
        refreshTokenRecord.tokenHash,
      );
      if (!tokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      refreshTokenRecord.revokedAt = new Date();
      await this.refreshTokensRepository.save(refreshTokenRecord);

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }

      return this.issueTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<LogoutResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      const refreshTokenRecord = await this.refreshTokensRepository.findOne({
        where: { jti: payload.jti, userId: payload.sub },
      });

      if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const tokenMatches = await bcrypt.compare(
        refreshToken,
        refreshTokenRecord.tokenHash,
      );
      if (!tokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      refreshTokenRecord.revokedAt = new Date();
      await this.refreshTokensRepository.save(refreshTokenRecord);

      return { loggedOut: true };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(user: User): Promise<TokenPairResponseDto> {
    const accessPayload = { sub: user.id, email: user.email };
    const refreshTokenJti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      jti: refreshTokenJti,
      type: 'refresh',
    };

    const accessExpiresIn = this.configService.get<string>(
      'JWT_EXPIRATION',
      '15m',
    ) as SignOptions['expiresIn'];
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    ) as SignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: accessExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: refreshExpiresIn,
    });

    const decodedRefreshToken = this.jwtService.decode(refreshToken);
    if (
      !decodedRefreshToken ||
      typeof decodedRefreshToken !== 'object' ||
      typeof decodedRefreshToken.exp !== 'number'
    ) {
      throw new UnauthorizedException('Failed to issue refresh token');
    }

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenRecord = this.refreshTokensRepository.create({
      jti: refreshTokenJti,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });
    await this.refreshTokensRepository.save(refreshTokenRecord);

    return {
      accessToken,
      refreshToken,
    };
  }

  private toSafeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
