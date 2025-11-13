import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query, Request } from '@nestjs/common';
import { SuratKehilanganService } from './surat-kehilangan.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, FindAllSuratKehilanganDto, findAllSuratKehilanganSchema, UpdateDto, updateSchema } from './dto/surat-kehilangan.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('surat-kehilangan')
export class SuratKehilanganController {
  constructor(private readonly suratKehilanganService: SuratKehilanganService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException({
              message: 'Hanya file JPG/JPEG yang diizinkan',
              errors: { [file.fieldname]: `File ${file.originalname} tidak valid` },
            }),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_MB || 1) * 1024 * 1024,
      },
    }),
  )
  async create(
    @Body(new ZodValidationPipe(createSchema)) data: CreateDto,
    @UploadedFiles() file: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    if (!file || file.length === 0) {
      throw new BadRequestException(
        {
          errors: [{ field: 'file', message: 'Minimal satu file wajib diunggah.' }],
        }
      );
    }

    const userId = req.user.userId;

    return this.suratKehilanganService.create(data, file, userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllSuratKehilanganSchema))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllSuratKehilanganDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratKehilanganService.findAll(query, req.user.userId);
    }
    return this.suratKehilanganService.findAll(query);
  }


  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratKehilanganService.findOne(+id, req.user.userId);
    }
    return this.suratKehilanganService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
      ],
      {
        limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 1) * 1024 * 1024 }, fileFilter: (req, file, cb) => {
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
      return this.suratKehilanganService.update(+id, body, files, req.user.userId);
    }
    return this.suratKehilanganService.update(+id, body, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratKehilanganService.remove(+id, req.user.userId);
    }
    return this.suratKehilanganService.remove(+id);
  }
}