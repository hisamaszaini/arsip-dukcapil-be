import { Module } from '@nestjs/common';
import { ArsipController } from './arsip.controller';
import { ArsipService } from './arsip.service';
import { KategoriModule } from '../kategori/kategori.module';

@Module({
  imports: [KategoriModule],
  controllers: [ArsipController],
  providers: [ArsipService],
})
export class ArsipModule {}
