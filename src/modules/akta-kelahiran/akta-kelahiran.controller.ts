import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException, UsePipes, Query, Request } from '@nestjs/common';
import { AktaKelahiranService } from './akta-kelahiran.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateDto, createSchema, DeleteBerkasDto, deleteBerkasSchema, FindAllAktaDto, findAllAktaSchema, UpdateDto, updateSchema } from './dto/akta-kelahiran.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../auth/auth.types';

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
    @Request() req: { user: JwtPayload }
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

    const userId = req.user.userId;
    return this.aktaKelahiranService.create(createAktaKelahiranDto, files, userId);
  }

  // @Post()
  // @HttpCode(HttpStatus.OK)
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'file1', maxCount: 1 },
  //       { name: 'file2', maxCount: 1 },
  //       { name: 'file3', maxCount: 1 },
  //       { name: 'file4', maxCount: 1 },
  //       { name: 'file5', maxCount: 1 },
  //       { name: 'file6', maxCount: 1 },
  //     ],
  //     {
  //       storage: diskStorage({
  //         destination: './uploads/akta-kelahiran',
  //         filename: (req, file, cb) => {
  //           const ext = path.extname(file.originalname);
  //           cb(null, `${uuidv4()}${ext}`);
  //         },
  //       }),
  //       fileFilter: (req, file, cb) => {
  //         if (!file.mimetype.match(/\/(jpg|jpeg)$/)) {
  //           return cb(new BadRequestException('Hanya file JPG/JPEG yang diizinkan'), false);
  //         }
  //         cb(null, true);
  //       },
  //       limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
  //     },
  //   ),
  // )
  // create(
  //   @Body(new ZodValidationPipe(createSchema)) createAktaKelahiranDto: any,
  //   @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
  //   @Request() req: { user: JwtPayload },
  // ) {
  //   const userId = req.user.userId;
  //   return this.aktaKelahiranService.create(createAktaKelahiranDto, files, userId);
  // }

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
    @Request() req: { user: JwtPayload },
  ) {
    const userId = req.user.userId;
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.update(+id, body, files, userId);
    } else {
      return this.aktaKelahiranService.update(+id, body, files);
    }
  }

  // @Delete(':id/berkas')
  // @HttpCode(HttpStatus.OK)
  // async deleteBerkas(
  //   @Param('id') id: string,
  //   @Body(new ZodValidationPipe(deleteBerkasSchema)) body: DeleteBerkasDto,
  //   @Request() req: { user: JwtPayload },
  // ) {
  //   if (req.user.role !== "ADMIN") {
  //     return this.aktaKelahiranService.deleteSatuBerkas(+id, body.fileKey, req.user.userId);
  //   }
  //   return this.aktaKelahiranService.deleteSatuBerkas(+id, body.fileKey);
  // }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    const userId = req.user.userId;
    if (req.user.role !== "ADMIN") {
      return this.aktaKelahiranService.remove(+id, userId);
    } else {
      return this.aktaKelahiranService.remove(+id);
    }
  }
}