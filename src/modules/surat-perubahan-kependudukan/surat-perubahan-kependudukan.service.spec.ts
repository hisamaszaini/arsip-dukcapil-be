import { Test, TestingModule } from '@nestjs/testing';
import { SuratPerubahanKependudukanService } from './surat-perubahan-kependudukan.service';

describe('SuratPerubahanKependudukanService', () => {
  let service: SuratPerubahanKependudukanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuratPerubahanKependudukanService],
    }).compile();

    service = module.get<SuratPerubahanKependudukanService>(
      SuratPerubahanKependudukanService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
