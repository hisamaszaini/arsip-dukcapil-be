import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query } from '@nestjs/common';
import { AktaKelahiranService } from './akta-kelahiran.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, FindAllAktaDto, findAllAktaSchema, UpdateDto, updateSchema } from './dto/akta-kelahiran.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@UseGuards(JwtAuthGuard)
@Controller('akta-kelahiran')
export class AktaKelahiranController {
  constructor(private readonly aktaKelahiranService: AktaKelahiranService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'fileSuratKelahiran', maxCount: 1 },
        { name: 'fileKk', maxCount: 1 },
        { name: 'fileSuratNikah', maxCount: 1 },
        { name: 'fileSPTJMKelahiran', maxCount: 1 },
        { name: 'fileSPTJMPernikahan', maxCount: 1 },
        { name: 'fileLampiran', maxCount: 1 }, // opsional
      ],
      {
        storage: diskStorage({
          destination: './uploads/akta-kelahiran',
          filename: (req, file, cb) => {
            if (!file) return cb(new BadRequestException('File tidak ditemukan'), '');
            const ext = path.extname(file.originalname);
            cb(null, `${uuidv4()}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file) return cb(new BadRequestException('File tidak ditemukan'), false);
          // Hanya izinkan JPG/JPEG
          if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
            return cb(new BadRequestException('Hanya file JPG/JPEG yang diizinkan'), false);
          }
          cb(null, true);
        },
        limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
      }
    ),
  )
  create(
    @Body(new ZodValidationPipe(createSchema)) createAktaKelahiranDto: CreateDto,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
  ) {
    const requiredFiles = [
      'fileSuratKelahiran',
      'fileKk',
      'fileSuratNikah',
      'fileSPTJMKelahiran',
      'fileSPTJMPernikahan',
    ];

    for (const key of requiredFiles) {
      if (!files[key] || files[key].length === 0) {
        throw new BadRequestException(`File ${key} wajib diunggah`);
      }
    }

    return this.aktaKelahiranService.create(createAktaKelahiranDto, files);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllAktaSchema))
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindAllAktaDto) {
    return this.aktaKelahiranService.findAll(query);
  }


  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.aktaKelahiranService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'fileSuratKelahiran', maxCount: 1 },
        { name: 'fileKk', maxCount: 1 },
        { name: 'fileSuratNikah', maxCount: 1 },
        { name: 'fileSPTJMKelahiran', maxCount: 1 },
        { name: 'fileSPTJMPernikahan', maxCount: 1 },
        { name: 'fileLampiran', maxCount: 1 },
      ],
      {
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
            return cb(new BadRequestException('Hanya file JPG/JPEG yang diizinkan'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: UpdateDto,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
  ) {
    return this.aktaKelahiranService.update(+id, body, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.aktaKelahiranService.remove(+id);
  }
}