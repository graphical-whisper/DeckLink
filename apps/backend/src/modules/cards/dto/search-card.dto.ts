import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, Min, IsArray } from 'class-validator';
import { CardLanguage } from '../enums/card-language.enum';
import { CardCondition } from '../enums/card-condition.enum';
import { CardRarity } from '../enums/card-rarity.enum';
import { Type } from 'class-transformer';

export class SearchCardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cardNumber?: string;

  @IsString()
  @IsOptional()
  set?: string;

  @IsEnum(CardLanguage)
  @IsOptional()
  language?: CardLanguage;

  @IsEnum(CardCondition)
  @IsOptional()
  condition?: CardCondition;

  @IsEnum(CardRarity)
  @IsOptional()
  rarity?: CardRarity;

  @IsBoolean()
  @IsOptional()
  alternateArt?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  validVersions?: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}