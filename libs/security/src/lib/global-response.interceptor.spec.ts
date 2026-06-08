import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { GlobalResponseInterceptor } from './global-response.interceptor';

describe('GlobalResponseInterceptor', () => {
  let interceptor: GlobalResponseInterceptor;
  const ctx = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new GlobalResponseInterceptor();
  });

  const handlerOf = (value: unknown): CallHandler =>
    ({ handle: () => of(value) }) as CallHandler;

  it('wraps plain payloads in the standard envelope', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(ctx, handlerOf({ id: 1 })),
    );

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: { id: 1 },
    });
  });

  it('passes through payloads that are already wrapped', async () => {
    const wrapped = { success: false, message: 'Already shaped' };

    const result = await lastValueFrom(
      interceptor.intercept(ctx, handlerOf(wrapped)),
    );

    expect(result).toBe(wrapped);
  });

  it('wraps primitive and null payloads as data', async () => {
    const resultNumber = await lastValueFrom(
      interceptor.intercept(ctx, handlerOf(42)),
    );
    expect(resultNumber).toEqual({
      success: true,
      message: 'Success',
      data: 42,
    });

    const resultNull = await lastValueFrom(
      interceptor.intercept(ctx, handlerOf(null)),
    );
    expect(resultNull).toEqual({
      success: true,
      message: 'Success',
      data: null,
    });
  });
});
