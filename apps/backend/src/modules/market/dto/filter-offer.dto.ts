import { IsEnum, IsNumber, IsOptional, IsString, Min, IsArray, IsUUID } from 'class-validator';
import { OfferType } from '../enums/offer-type.enum';
import { CardCondition } from '../../cards/enums/card-condition.enum';
import { CardLanguage } from '../../cards/enums/card-language.enum';

export class FilterOfferDto {
  @IsOptional()
  @IsEnum(OfferType)
  type?: OfferType;

  @IsOptional()
  @IsUUID()
  cardId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cardIds?: string[];

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(CardLanguage)
  language?: CardLanguage;

  @IsOptional()
  @IsEnum(CardCondition)
  condition?: CardCondition;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}