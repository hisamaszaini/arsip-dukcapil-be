import { Test, TestingModule } from '@nestjs/testing';
import { AktaKematianService } from './akta-kematian.service';

describe('AktaKematianService', () => {
  let service: AktaKematianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AktaKematianService],
    }).compile();

    service = module.get<AktaKematianService>(AktaKematianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
