import { Module } from '@nestjs/common';
import { SuratPerubahanKependudukanService } from './surat-perubahan-kependudukan.service';
import { SuratPerubahanKependudukanController } from './surat-perubahan-kependudukan.controller';

@Module({
  controllers: [SuratPerubahanKependudukanController],
  providers: [SuratPerubahanKependudukanService],
})
export class SuratPerubahanKependudukanModule {}
