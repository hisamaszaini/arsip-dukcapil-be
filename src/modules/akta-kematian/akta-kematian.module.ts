import { Module } from '@nestjs/common';
import { AktaKematianService } from './akta-kematian.service';
import { AktaKematianController } from './akta-kematian.controller';

@Module({
  controllers: [AktaKematianController],
  providers: [AktaKematianService],
})
export class AktaKematianModule {}
