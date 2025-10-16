import { Module } from '@nestjs/common';
import { SuratKehilanganService } from './surat-kehilangan.service';
import { SuratKehilanganController } from './surat-kehilangan.controller';

@Module({
  controllers: [SuratKehilanganController],
  providers: [SuratKehilanganService],
})
export class SuratKehilanganModule {}
