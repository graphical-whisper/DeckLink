import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdsModule } from '../ads/ads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AdsModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}