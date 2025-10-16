import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as path from 'path';
import * as moduleAlias from 'module-alias';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { cwd } from 'process';
import { ensureUploadDirs } from './common/utils/ensure-upload-dirs';

moduleAlias.addAliases({
  '@': path.resolve(__dirname, 'src'),
  '@auth': path.resolve(__dirname, 'src/auth'),
});
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://127.0.0.1:5173',
    credentials: true,
  });
  app.use(cookieParser());
  app.use(express.json());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use('/uploads', express.static(join(cwd(), 'uploads')));
  // ensureUploadDirs();

  const port = process.env.PORT || 3334;

  await app.listen(port);
  console.log(`🚀 HTTP server running on http://127.0.0.1:${port}`);
}
bootstrap();
