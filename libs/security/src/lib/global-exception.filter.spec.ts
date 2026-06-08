import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let reply: jest.Mock;
  let responseRef: object;
  let host: ArgumentsHost;
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    reply = jest.fn();
    responseRef = { isResponse: true };
    host = {
      switchToHttp: () => ({ getResponse: () => responseRef }),
    } as unknown as ArgumentsHost;
    filter = new GlobalExceptionFilter({
      httpAdapter: { reply },
    } as never);
  });

  it('maps a string HttpException response to the message', () => {
    filter.catch(new HttpException('teapot', HttpStatus.I_AM_A_TEAPOT), host);

    expect(reply).toHaveBeenCalledWith(
      responseRef,
      { success: false, message: 'teapot' },
      HttpStatus.I_AM_A_TEAPOT,
    );
  });

  it('extracts the message from an object HttpException response', () => {
    filter.catch(new BadRequestException('bad input'), host);

    expect(reply).toHaveBeenCalledWith(
      responseRef,
      { success: false, message: 'bad input' },
      HttpStatus.BAD_REQUEST,
    );
  });

  it('treats an array message as validation errors', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['name must be a string', 'email is invalid'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(reply).toHaveBeenCalledWith(
      responseRef,
      {
        success: false,
        message: 'Validation failed',
        errors: ['name must be a string', 'email is invalid'],
      },
      HttpStatus.BAD_REQUEST,
    );
  });

  it('maps a generic Error to a 500 with its message', () => {
    filter.catch(new Error('boom'), host);

    expect(reply).toHaveBeenCalledWith(
      responseRef,
      { success: false, message: 'boom' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('falls back to a generic 500 for non-error throwables', () => {
    filter.catch('weird non-error throwable', host);

    expect(reply).toHaveBeenCalledWith(
      responseRef,
      { success: false, message: 'Internal server error' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
