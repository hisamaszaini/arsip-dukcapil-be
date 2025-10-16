import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Query, UsePipes, Request, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateDto, createSchema, FindAllUserDto, findAllUserSchema, UpdateDto, updateSchema } from './dto/user.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @UsePipes(new ZodValidationPipe(createSchema))
  @HttpCode(HttpStatus.OK)
  create(
    @Body() createUserDto: CreateDto
  ) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findAllUserSchema))
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() query: FindAllUserDto
  ) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch('profile')
  updateProfile(
    @Body(new ZodValidationPipe(updateSchema)) updateUserDto: UpdateDto,
    @Request() req,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Silahkan login terlebih dahulu');
    }
    const userId = req.user.userId;
    return this.userService.update(+userId, updateUserDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) updateUserDto: UpdateDto
  ) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
