import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaModule } from './../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AktaKelahiranModule } from './modules/akta-kelahiran/akta-kelahiran.module';
import { AktaKematianModule } from './modules/akta-kematian/akta-kematian.module';
import { SuratKehilanganModule } from './modules/surat-kehilangan/surat-kehilangan.module';
import { SuratPermohonanPindahModule } from './modules/surat-permohonan-pindah/surat-permohonan-pindah.module';
import { SuratPerubahanKependudukanModule } from './modules/surat-perubahan-kependudukan/surat-perubahan-kependudukan.module';

@Module({
  imports: [
    DashboardModule,
    PrismaModule,
    UserModule,
    AuthModule,
    AktaKelahiranModule,
    AktaKematianModule,
    SuratKehilanganModule,
    SuratPermohonanPindahModule,
    SuratPerubahanKependudukanModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
