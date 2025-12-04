import { Test, TestingModule } from '@nestjs/testing';
import { SuratPerubahanKependudukanController } from './surat-perubahan-kependudukan.controller';
import { SuratPerubahanKependudukanService } from './surat-perubahan-kependudukan.service';

describe('SuratPerubahanKependudukanController', () => {
  let controller: SuratPerubahanKependudukanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuratPerubahanKependudukanController],
      providers: [SuratPerubahanKependudukanService],
    }).compile();

    controller = module.get<SuratPerubahanKependudukanController>(
      SuratPerubahanKependudukanController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
