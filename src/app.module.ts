import { PrismaModule } from './../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { KategoriModule } from './modules/kategori/kategori.module';
import { ArsipModule } from './modules/arsip/arsip.module';
import { AppCacheModule } from './cache.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    DashboardModule,
    KategoriModule,
    ArsipModule,
    AppCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
