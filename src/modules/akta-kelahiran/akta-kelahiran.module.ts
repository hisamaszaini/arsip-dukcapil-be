import { Module } from '@nestjs/common';
import { AktaKelahiranService } from './akta-kelahiran.service';
import { AktaKelahiranController } from './akta-kelahiran.controller';

@Module({
  controllers: [AktaKelahiranController],
  providers: [AktaKelahiranService],
})
export class AktaKelahiranModule {}
