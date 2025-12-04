import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UsePipes,
  Query,
  Request,
} from '@nestjs/common';
import { SuratKehilanganService } from './surat-kehilangan.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {
  CreateDto,
  createSchema,
  FindAllSuratKehilanganDto,
  findAllSuratKehilanganSchema,
  UpdateDto,
  updateSchema,
} from './dto/surat-kehilangan.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('surat-kehilangan')
export class SuratKehilanganController {
  constructor(
    private readonly suratKehilanganService: SuratKehilanganService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 1, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException({
              success: false,
              message: 'Format file tidak valid',
              errors: {
                [file.fieldname]: `File ${file.originalname} harus JPG/JPEG`,
              },
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
      throw new BadRequestException({
        success: false,
        errors: { files: 'Minimal satu file wajib diunggah.' },
      });
    }

    return this.suratKehilanganService.create(data, files, req.user.userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllSuratKehilanganSchema, 'query'))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllSuratKehilanganDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== 'ADMIN') {
      return this.suratKehilanganService.findAll(query, req.user.userId);
    }
    return this.suratKehilanganService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role !== 'ADMIN') {
      return this.suratKehilanganService.findOne(+id, req.user.userId);
    }
    return this.suratKehilanganService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 1 }], {
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_MB || 1) * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException('Hanya file JPG/JPEG yang diizinkan'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: UpdateDto,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role !== 'ADMIN') {
      return this.suratKehilanganService.update(
        +id,
        body,
        files,
        req.user.userId,
      );
    }
    return this.suratKehilanganService.update(+id, body, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    if (req.user.role !== 'ADMIN') {
      return this.suratKehilanganService.remove(+id, req.user.userId);
    }
    return this.suratKehilanganService.remove(+id);
  }
}
