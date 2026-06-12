import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard, RolesGuard } from '@erp/auth';
import { TusServerService } from './tus-server.service';

@Controller('files/tus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TusController {
  constructor(private readonly tusService: TusServerService) {}

  @All()
  async handle(@Req() req: Request, @Res() res: Response) {
    this.tusService.handle(req, res);
  }
}
