import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdConfig } from './entities/ad-config.entity';
import { AdImpression } from './entities/ad-impression.entity';
import { UserAdPreferences } from './entities/user-ad-preferences.entity';
import { AdService } from './ad.service';
import { AdController } from '../ad.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdConfig, AdImpression, UserAdPreferences]),
    UserModule,
  ],
  providers: [AdService],
  controllers: [AdController],
  exports: [AdService],
})
export class AdsModule {}