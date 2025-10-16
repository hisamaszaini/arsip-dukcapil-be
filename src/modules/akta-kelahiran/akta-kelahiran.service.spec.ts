import { Test, TestingModule } from '@nestjs/testing';
import { AktaKelahiranService } from './akta-kelahiran.service';

describe('AktaKelahiranService', () => {
  let service: AktaKelahiranService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AktaKelahiranService],
    }).compile();

    service = module.get<AktaKelahiranService>(AktaKelahiranService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
