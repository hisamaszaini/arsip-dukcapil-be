import { Test, TestingModule } from '@nestjs/testing';
import { SuratPermohonanPindahService } from './surat-permohonan-pindah.service';

describe('SuratPermohonanPindahService', () => {
  let service: SuratPermohonanPindahService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuratPermohonanPindahService],
    }).compile();

    service = module.get<SuratPermohonanPindahService>(SuratPermohonanPindahService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
