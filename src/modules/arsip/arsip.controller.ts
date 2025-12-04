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
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ArsipService } from './arsip.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  CreateArsipDto,
  createArsipSchema,
  FindAllArsipDto,
  findAllArsipSchema,
  UpdateArsipDto,
  updateArsipSchema,
  CreateArsipBySlugDto,
  createArsipBySlugSchema,
} from './dto/arsip.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('arsip')
export class ArsipController {
  constructor(private readonly arsipService: ArsipService) { }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 30, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException({
              message: 'Hanya file JPG/JPEG yang diizinkan',
              errors: {
                [file.fieldname]: `File ${file.originalname} tidak valid`,
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
  create(
    @Body(new ZodValidationPipe(createArsipSchema)) data: CreateArsipDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        errors: [
          { field: 'files', message: 'Minimal satu file wajib diunggah.' },
        ],
      });
    }
    const userId = req.user.userId;
    return this.arsipService.create(data, files, userId);
  }

  @Post(':slug')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 30, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException({
              message: 'Hanya file JPG/JPEG yang diizinkan',
              errors: {
                [file.fieldname]: `File ${file.originalname} tidak valid`,
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
  createBySlug(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(createArsipBySlugSchema))
    data: CreateArsipBySlugDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        errors: [
          { field: 'files', message: 'Minimal satu file wajib diunggah.' },
        ],
      });
    }
    const userId = req.user.userId;
    return this.arsipService.createBySlug(slug, data, files, userId);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllArsipSchema, 'query'))
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindAllArsipDto) {
    return this.arsipService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.arsipService.findOne(+id);
  }

  @Get(['file/:id/content', 'file/:id/content/:filename'])
  @HttpCode(HttpStatus.OK)
  async serveFile(@Param('id') id: string, @Request() req: any, @Res() res: any) {
    // Optional: Add guard if needed, but usually images are public or protected by cookie
    // For now, we assume protected by Guard at Controller level
    // For now, we assume protected by Guard at Controller level
    return this.arsipService.serveFile(+id, res);
  }

  @Patch(':id/sync')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  toggleSync(@Param('id', ParseIntPipe) id: number) {
    return this.arsipService.toggleSync(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @UseInterceptors(
    FilesInterceptor('files', 30, {
      storage: memoryStorage(),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_MB || 1) * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
          return cb(
            new BadRequestException({
              message: 'Hanya file JPG/JPEG yang diizinkan',
              errors: {
                [file.fieldname]: `File ${file.originalname} tidak valid`,
              },
            }),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @UsePipes(new ZodValidationPipe(updateArsipSchema))
  update(
    @Param('id') id: string,
    @Body() updateArsipDto: UpdateArsipDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: { user: JwtPayload },
  ) {
    const arsipId = Number(id);
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.arsipService.update(
      arsipId,
      updateArsipDto,
      files,
      userId,
      userRole,
    );
  }

  @Delete('file/:id')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  removeFile(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.arsipService.removeFile(+id, userId, userRole);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return this.arsipService.remove(+id, userId, userRole);
  }
}
