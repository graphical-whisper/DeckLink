import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { Offer } from './entities/offer.entity';
import { OfferCard } from './entities/offer-card.entity';
import { UserModule } from '../user/user.module';
import { CardsModule } from '../cards/cards.module';
import { AdsModule } from '../ads/ads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, OfferCard]),
    UserModule,
    CardsModule,
    AdsModule,
  ],
  providers: [MarketService],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}