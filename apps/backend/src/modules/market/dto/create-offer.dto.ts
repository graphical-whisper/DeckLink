import { IsEnum, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min, IsBoolean, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType } from '../enums/offer-type.enum';
import { BundlePreference } from '../enums/bundle-preference.enum';
import { CreateOfferCardDto } from './create-offer-card.dto';

export class CreateOfferDto {
  @IsEnum(OfferType)
  type!: OfferType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOfferCardDto)
  offerCards!: CreateOfferCardDto[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BundlePreference)
  bundlePreference?: BundlePreference;

  @IsOptional()
  @IsBoolean()
  isBundle?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSeparateSale?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationDays?: number;
}