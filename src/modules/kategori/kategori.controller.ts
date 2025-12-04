import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { KategoriService } from './kategori.service';
import {
  CreateKategoriDto,
  CreateKategoriSchema,
  FindAllKategoriDto,
  findAllKategoriSchema,
  UpdateKategoriDto,
  UpdateKategoriSchema,
} from './dto/kategori.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kategori')
export class KategoriController {
  constructor(private readonly kategoriService: KategoriService) {}

  @Post()
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(CreateKategoriSchema))
  @HttpCode(HttpStatus.OK)
  create(@Body() createKategoriDto: CreateKategoriDto) {
    return this.kategoriService.create(createKategoriDto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllKategoriSchema, 'query'))
  findAll(@Query() query: FindAllKategoriDto) {
    return this.kategoriService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.kategoriService.findOne(+id);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  findBySlug(@Param('slug') slug: string) {
    return this.kategoriService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(UpdateKategoriSchema))
  update(
    @Param('id') id: string,
    @Body() updateKategoriDto: UpdateKategoriDto,
  ) {
    return this.kategoriService.update(+id, updateKategoriDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @Body('password') password?: string,
    @Req() req?: any,
  ) {
    return this.kategoriService.remove(+id, password, req?.user?.userId);
  }
}
