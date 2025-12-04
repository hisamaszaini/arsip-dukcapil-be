import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
