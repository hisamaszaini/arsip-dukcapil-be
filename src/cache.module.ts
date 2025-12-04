import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 0,
      max: 100,
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
