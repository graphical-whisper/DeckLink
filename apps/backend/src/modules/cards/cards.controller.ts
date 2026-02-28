import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseUUIDPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { SearchCardDto } from './dto/search-card.dto';
import { Card } from './entities/card.entity';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async create(@Body() createCardDto: CreateCardDto): Promise<Card> {
    return await this.cardsService.create(createCardDto);
  }

  @Get()
  async findAll(@Query() searchCardDto: SearchCardDto): Promise<{ cards: Card[]; total: number }> {
    return await this.cardsService.findAll(searchCardDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Card> {
    return await this.cardsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: Partial<CreateCardDto>,
  ): Promise<Card> {
    return await this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.cardsService.remove(id);
  }

  @Get('search/number/:cardNumber')
  async findByCardNumber(@Param('cardNumber') cardNumber: string): Promise<Card[]> {
    return await this.cardsService.findByCardNumber(cardNumber);
  }

  @Get('search/set/:setName')
  async findBySet(@Param('setName') setName: string): Promise<Card[]> {
    return await this.cardsService.findBySet(setName);
  }
}