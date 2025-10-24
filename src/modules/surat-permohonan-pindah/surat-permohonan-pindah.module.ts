import { Module } from '@nestjs/common';
import { SuratPermohonanPindahService } from './surat-permohonan-pindah.service';
import { SuratPermohonanPindahController } from './surat-permohonan-pindah.controller';

@Module({
  controllers: [SuratPermohonanPindahController],
  providers: [SuratPermohonanPindahService],
})
export class SuratPermohonanPindahModule {}
