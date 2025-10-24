import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, BadRequestException, UploadedFiles, Request, UsePipes, Query } from '@nestjs/common';
import { SuratPerubahanKependudukanService } from './surat-perubahan-kependudukan.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../auth/auth.types';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CreateDto, createSchema, FindAllSuratPerubahanKependudukanDto, findAllSuratPerubahanKependudukanSchema, UpdateDto, updateSchema } from './dto/surat-perubahan-kependudukan.dto';

@UseGuards(JwtAuthGuard)
@Controller('surat-perubahan-kependudukan')
export class SuratPerubahanKependudukanController {
  constructor(private readonly suratPerubahanKependudukanService: SuratPerubahanKependudukanService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'filePerubahan', maxCount: 1 },
        { name: 'fileKk', maxCount: 1 },
        { name: 'fileLampiran', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/surat-perubahan-kependudukan',
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
    @Body(new ZodValidationPipe(createSchema)) data: CreateDto,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Request() req: { user: JwtPayload }
  ) {
    const requiredFiles = [
      'filePerubahan',
      'fileKk',
    ];

    for (const key of requiredFiles) {
      if (!files[key] || files[key].length === 0) {
        throw new BadRequestException(`File ${key} wajib diunggah`);
      }
    }
    const userId = req.user.userId;

    return this.suratPerubahanKependudukanService.create(data, files, userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllSuratPerubahanKependudukanSchema))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllSuratPerubahanKependudukanDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPerubahanKependudukanService.findAll(query, req.user.userId);
    }
    return this.suratPerubahanKependudukanService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPerubahanKependudukanService.findOne(+id, req.user.userId);
    }
    return this.suratPerubahanKependudukanService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'filePerubahan', maxCount: 1 },
        { name: 'fileKk', maxCount: 1 },
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
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPerubahanKependudukanService.update(+id, body, files, req.user.userId);
    }
    return this.suratPerubahanKependudukanService.update(+id, body, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPerubahanKependudukanService.remove(+id, req.user.userId);
    }
    return this.suratPerubahanKependudukanService.remove(+id);
  }
}