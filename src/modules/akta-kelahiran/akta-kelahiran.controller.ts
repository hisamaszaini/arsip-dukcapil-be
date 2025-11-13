import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query, Request } from '@nestjs/common';
import { AktaKelahiranService } from './akta-kelahiran.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, FindAllAktaDto, findAllAktaSchema, UpdateDto, updateSchema } from './dto/akta-kelahiran.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtPayload } from '../auth/auth.types';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard)
@Controller('akta-kelahiran')
export class AktaKelahiranController {
  constructor(private readonly aktaKelahiranService: AktaKelahiranService) { }

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

    return this.aktaKelahiranService.create(data, files, userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllAktaSchema))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllAktaDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.findAll(query, req.user.userId);
    }
    return this.aktaKelahiranService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.findOne(+id, req.user.userId);
    }
    return this.aktaKelahiranService.findOne(+id);
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
    const aktaId = Number(id);
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    return this.aktaKelahiranService.update(aktaId, body, files, userId, isAdmin);
  }

  @Delete('file/:id')
  @HttpCode(HttpStatus.OK)
  removeFile(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.removeFile(+id, req.user.userId);
    }
    return this.aktaKelahiranService.removeFile(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.remove(+id, req.user.userId);
    }
    return this.aktaKelahiranService.remove(+id);
  }
}