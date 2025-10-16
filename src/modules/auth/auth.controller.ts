import {
  Controller,
  Post,
  Body,
  UsePipes,
  HttpCode,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { LoginDto, loginSchema } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { User } from './auth.types';
import { GetUser } from '@/common/decorators/user.decorator';
import { UserService } from '@/modules/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UserService
  ) { }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.userId;
    return this.usersService.findOne(userId);
  }

  /* Login */
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: result.message };
  }

  /* Refresh */
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    // console.log(`[COOKIES] : ${refreshToken}`);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: result.message };
  }

  /* Logout */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }
}