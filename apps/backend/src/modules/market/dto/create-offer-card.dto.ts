import { IsUUID, IsNumber, IsEnum, IsOptional, Min, IsString } from 'class-validator';
import { CardCondition } from '../../cards/enums/card-condition.enum';
import { CardLanguage } from '../../cards/enums/card-language.enum';

export class CreateOfferCardDto {
  @IsUUID()
  cardId!: string; 

  @IsNumber()
  @Min(1)
  quantity!: number; 

  @IsNumber()
  @Min(0.01)
  pricePerUnit!: number;

  @IsOptional()
  @IsEnum(CardCondition)
  condition?: CardCondition;

  @IsOptional()
  @IsEnum(CardLanguage)
  language?: CardLanguage;

  @IsOptional()
  @IsString()
  notes?: string;
}