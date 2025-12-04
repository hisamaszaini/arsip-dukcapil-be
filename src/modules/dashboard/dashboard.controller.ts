import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DashboardService } from './dashboard.service';
import { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  dashboardData(@Request() req: { user: JwtPayload }) {
    const user = req.user;
    if (user.role === 'ADMIN') {
      return this.dashboardService.getDashboardDataAll();
    } else {
      return this.dashboardService.getDashboardDataOperatorAll(req.user.userId);
    }
  }
}
