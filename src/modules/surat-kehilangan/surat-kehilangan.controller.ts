import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query } from '@nestjs/common';
import { SuratKehilanganService } from './surat-kehilangan.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, FindAllSuratKehilanganDto, findAllSuratKehilanganSchema, UpdateDto, updateSchema } from './dto/surat-kehilangan.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@UseGuards(JwtAuthGuard)
@Controller('surat-kehilangan')
export class SuratKehilanganController {
  constructor(private readonly suratKehilanganService: SuratKehilanganService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/surat-kehilangan',
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
    @Body(new ZodValidationPipe(createSchema)) createSuratKehilanganDto: CreateDto,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
  ) {
    const requiredFiles = [
      'file',
    ];

    for (const key of requiredFiles) {
      if (!files[key] || files[key].length === 0) {
        throw new BadRequestException(`File ${key} wajib diunggah`);
      }
    }

    return this.suratKehilanganService.create(createSuratKehilanganDto, files);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllSuratKehilanganSchema))
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindAllSuratKehilanganDto) {
    return this.suratKehilanganService.findAll(query);
  }


  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.suratKehilanganService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
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
    return this.suratKehilanganService.update(+id, body, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.suratKehilanganService.remove(+id);
  }
}