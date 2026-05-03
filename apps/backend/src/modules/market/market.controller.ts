import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req, 
  Delete, 
  Put,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MarketService } from './market.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { FilterOfferDto } from './dto/filter-offer.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('market/offers')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOffer(
    @Req() req: AuthenticatedRequest,
    @Body() createOfferDto: CreateOfferDto
  ) {
    const userId = req.user.id;
    return this.marketService.createOffer(userId, createOfferDto);
  }

  @Get()
  async findAllOffers(
    @Query() filterOfferDto: FilterOfferDto,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.id;
    return this.marketService.findAllOffers(filterOfferDto, userId);
  }

  @Get('search')
  async searchOffers(
    @Query() filterOfferDto: FilterOfferDto,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.id;
    return this.marketService.searchOffers(filterOfferDto, userId);
  }

  @Get('my-offers')
  @UseGuards(JwtAuthGuard)
  async getUserOffers(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.marketService.getUserOffers(userId);
  }

  @Get(':id')
  async findOfferById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.id;
    return this.marketService.findOfferById(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateOfferDto
  ) {
    const userId = req.user.id;
    return this.marketService.updateOffer(userId, id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    return this.marketService.deleteOffer(userId, id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    return this.marketService.acceptOffer(userId, id);
  }

  @Post(':id/mark-sold')
  @UseGuards(JwtAuthGuard)
  async markOfferAsSold(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    return this.marketService.markOfferAsSold(id, userId);
  }

  @Post('expire-offers')
  async expireOffers(): Promise<void> {
    return this.marketService.expireOffers();
  }
}