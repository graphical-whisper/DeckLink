import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdService } from './entities/ad.service';
import { AdPlacement } from './entities/ad-config.entity';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Get('placement/:placement')
  async getAd(
    @Req() req: AuthenticatedRequest,
    @Param('placement') placement: AdPlacement
  ) {
    const user = req.user;
    return this.adService.getAdForUser(user, placement);
  }

  @Post('impression/:placement')
  async recordImpression(
    @Req() req: AuthenticatedRequest,
    @Param('placement') placement: AdPlacement,
    @Body() body: { adConfigId: string; revenue?: number; adProviderId?: string }
  ) {
    const user = req.user;
    // En una implementación real, buscarías el AdConfig por ID
    // Por simplicidad, aquí se asume que ya tienes el objeto AdConfig
    return { success: true };
  }

  @Get('stats')
  async getAdStats(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    return this.adService.getAdStats(user.id);
  }
}