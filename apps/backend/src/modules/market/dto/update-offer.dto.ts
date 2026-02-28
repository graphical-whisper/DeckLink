import { PartialType } from '@nestjs/mapped-types';
import { CreateOfferDto } from './create-offer.dto';
import { IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferStatus } from '../enums/offer-status.enum';
import { CreateOfferCardDto } from './create-offer-card.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOfferCardDto)
  offerCards?: CreateOfferCardDto[];

  @IsOptional()
  @IsBoolean()
  isBundle?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSeparateSale?: boolean;
}