import { Test, TestingModule } from '@nestjs/testing';
import { AktaKelahiranController } from './akta-kelahiran.controller';
import { AktaKelahiranService } from './akta-kelahiran.service';

describe('AktaKelahiranController', () => {
  let controller: AktaKelahiranController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AktaKelahiranController],
      providers: [AktaKelahiranService],
    }).compile();

    controller = module.get<AktaKelahiranController>(AktaKelahiranController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
