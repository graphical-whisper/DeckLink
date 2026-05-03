import { IsEnum, IsString, IsBoolean, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { CardLanguage } from '../enums/card-language.enum';
import { CardCondition } from '../enums/card-condition.enum';
import { CardRarity } from '../enums/card-rarity.enum';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  cardNumber!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(CardLanguage)
  language!: CardLanguage;

  @IsEnum(CardCondition)
  condition!: CardCondition;

  @IsEnum(CardRarity)
  rarity!: CardRarity;

  @IsString()
  @IsNotEmpty()
  set!: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  validVersions?: string[];

  @IsBoolean()
  alternateArt!: boolean;

  @IsString()
  @IsNotEmpty()
  description!: string;
}