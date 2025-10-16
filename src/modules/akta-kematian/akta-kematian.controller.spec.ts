import { Test, TestingModule } from '@nestjs/testing';
import { AktaKematianController } from './akta-kematian.controller';
import { AktaKematianService } from './akta-kematian.service';

describe('AktaKematianController', () => {
  let controller: AktaKematianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AktaKematianController],
      providers: [AktaKematianService],
    }).compile();

    controller = module.get<AktaKematianController>(AktaKematianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
