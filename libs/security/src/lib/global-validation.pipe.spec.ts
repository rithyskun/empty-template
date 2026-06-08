import 'reflect-metadata';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { IsString } from 'class-validator';
import { GlobalValidationPipe } from './global-validation.pipe';

class SampleDto {
  @IsString()
  name!: string;
}

const bodyMeta: ArgumentMetadata = {
  type: 'body',
  metatype: SampleDto,
  data: '',
};

describe('GlobalValidationPipe', () => {
  let pipe: GlobalValidationPipe;

  beforeEach(() => {
    pipe = new GlobalValidationPipe();
  });

  it('is a configured ValidationPipe', () => {
    expect(pipe).toBeInstanceOf(ValidationPipe);
  });

  it('transforms a valid payload into the DTO instance', async () => {
    const result = await pipe.transform({ name: 'ok' }, bodyMeta);

    expect(result).toBeInstanceOf(SampleDto);
    expect(result.name).toBe('ok');
  });

  it('rejects payloads with non-whitelisted properties', async () => {
    await expect(
      pipe.transform({ name: 'ok', hacker: 'x' }, bodyMeta),
    ).rejects.toBeDefined();
  });

  it('rejects payloads that fail validation', async () => {
    await expect(
      pipe.transform({ name: 123 }, bodyMeta),
    ).rejects.toBeDefined();
  });
});
