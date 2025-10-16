import { Test, TestingModule } from '@nestjs/testing';
import { SuratKehilanganService } from './surat-kehilangan.service';

describe('SuratKehilanganService', () => {
  let service: SuratKehilanganService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuratKehilanganService],
    }).compile();

    service = module.get<SuratKehilanganService>(SuratKehilanganService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
