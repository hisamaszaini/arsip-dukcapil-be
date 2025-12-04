import { Test, TestingModule } from '@nestjs/testing';
import { SuratPermohonanPindahController } from './surat-permohonan-pindah.controller';
import { SuratPermohonanPindahService } from './surat-permohonan-pindah.service';

describe('SuratPermohonanPindahController', () => {
  let controller: SuratPermohonanPindahController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuratPermohonanPindahController],
      providers: [SuratPermohonanPindahService],
    }).compile();

    controller = module.get<SuratPermohonanPindahController>(
      SuratPermohonanPindahController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
