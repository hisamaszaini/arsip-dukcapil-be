import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query, Request } from '@nestjs/common';
import { SuratPermohonanPindahService } from './surat-permohonan-pindah.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, FindAllSuratPermohonanPindahDto, findAllSuratPermohonanPindahSchema, UpdateDto, updateSchema } from './dto/surat-permohonan-pindah.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('surat-permohonan-pindah')
export class SuratPermohonanPindahController {
  constructor(private readonly suratPermohonanPindahService: SuratPermohonanPindahService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
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
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        {
          errors: [{ field: 'files', message: 'Minimal satu file wajib diunggah.' }],
        }
      );
    }

    const userId = req.user.userId;

    return this.suratPermohonanPindahService.create(data, files, userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllSuratPermohonanPindahSchema))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllSuratPermohonanPindahDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPermohonanPindahService.findAll(query, req.user.userId);
    }
    return this.suratPermohonanPindahService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPermohonanPindahService.findOne(+id, req.user.userId);
    }
    return this.suratPermohonanPindahService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 1) * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(new BadRequestException({
            message: 'Hanya file JPG/JPEG yang diizinkan',
            errors: { [file.fieldname]: `File ${file.originalname} tidak valid` },
          }), false);
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: UpdateDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    const suratId = Number(id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    return this.suratPermohonanPindahService.update(suratId, body, files, userId, isAdmin);
  }

  @Delete('file/:id')
  @HttpCode(HttpStatus.OK)
  removeFile(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPermohonanPindahService.removeFile(+id, req.user.userId);
    }
    return this.suratPermohonanPindahService.removeFile(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.suratPermohonanPindahService.remove(+id, req.user.userId);
    }
    return this.suratPermohonanPindahService.remove(+id);
  }
}