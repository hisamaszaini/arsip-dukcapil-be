import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';
import { hash, verify } from './auth.util';
import { TokenPair } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  // REGISTER USER
  // async register(dto: RegisterDto) {
  //   const emailExists = await this.prisma.user.findUnique({
  //     where: { email: dto.email },
  //   });
  //   if (emailExists) throw new ConflictException('Email sudah terdaftar');

  //   const usernameExists = await this.prisma.user.findUnique({
  //     where: { username: dto.username },
  //   });
  //   if (usernameExists) throw new ConflictException('Username sudah terdaftar');

  //   const user = await this.prisma.user.create({
  //     data: {
  //       noHp: dto.noHp,
  //       email: dto.email,
  //       username: dto.username,
  //       password: await hash(dto.password),
  //       role: dto.role,
  //     },
  //   });

  //   const { password, refreshToken, ...userData } = user;
  //   return { message: 'Akun berhasil dibuat', data: userData };
  // }

  // LOGIN
  async login(dto: LoginDto): Promise<{ message: string; data: TokenPair }> {
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: dto.username, mode: 'insensitive' } },
    });
    if (!user || !(await verify(dto.password, user.password))) {
      throw new UnauthorizedException('Username atau password salah!');
    }

    if (user.statusUser === 'INACTIVE') {
      throw new UnauthorizedException({
        message: 'Akun Anda dinonaktifkan. Silakan hubungi administrator.',
        error: 'UNAUTHORIZED',
        errors: {
          helpLink: `https://wa.me/6281234567890`,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { message: 'Login successful', data: tokens };
  }

  // REFRESH TOKEN
  async refresh(refreshToken: string) {
    try {
      // console.log('[SERVICE] Incoming refreshToken (raw):', refreshToken);

      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      // console.log('[SERVICE] Decoded JWT payload:', payload);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      // console.log('[SERVICE] User from DB:', user?.id, user?.email);

      if (!user || !user.refreshToken) {
        console.warn('[SERVICE] User not found or refreshToken missing in DB');
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await verify(refreshToken, user.refreshToken);
      // console.log('[SERVICE] bcrypt.compare result:', isValid);

      if (!isValid) {
        // console.warn('[SERVICE] Refresh token does not match hash in DB');
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      // console.log('[SERVICE] New tokens generated:', tokens);

      await this.updateRefreshToken(user.id, tokens.refreshToken);
      // console.log('[SERVICE] Refresh token updated in DB');

      return { message: 'Token refreshed', data: tokens };
    } catch (e) {
      console.error('[SERVICE] Refresh error:', e.message);
      throw new UnauthorizedException('Refresh failed');
    }
  }

  // LOGOUT
  async logout(userId: number): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // VALIDATE USER BY ID
  async validateUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
  }

  // PRIVATE HELPERS
  private async generateTokens(
    sub: number,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub, email, role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      },
    );

    const refreshToken = this.jwt.sign(
      { sub },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashed = await hash(refreshToken);
    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: { refreshToken: hashed },
    });
  }
}
