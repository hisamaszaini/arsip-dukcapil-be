import { Test, TestingModule } from '@nestjs/testing';
import { SuratKehilanganController } from './surat-kehilangan.controller';
import { SuratKehilanganService } from './surat-kehilangan.service';

describe('SuratKehilanganController', () => {
  let controller: SuratKehilanganController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuratKehilanganController],
      providers: [SuratKehilanganService],
    }).compile();

    controller = module.get<SuratKehilanganController>(
      SuratKehilanganController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
