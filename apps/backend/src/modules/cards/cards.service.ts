import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, FindManyOptions } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { SearchCardDto } from './dto/search-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const card = this.cardRepository.create(createCardDto);
    return await this.cardRepository.save(card);
  }

  async findAll(searchCardDto: SearchCardDto): Promise<{ cards: Card[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = searchCardDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.name) {
      where.name = ILike(`%${filters.name}%`);
    }

    if (filters.cardNumber) {
      where.cardNumber = ILike(`%${filters.cardNumber}%`);
    }

    if (filters.set) {
      where.set = ILike(`%${filters.set}%`);
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.rarity) {
      where.rarity = filters.rarity;
    }

    if (filters.alternateArt !== undefined) {
      where.alternateArt = filters.alternateArt;
    }

    if (filters.validVersions && filters.validVersions.length > 0) {
      where.validVersions = filters.validVersions;
    }

    const [cards, total] = await this.cardRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { cards, total };
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }
    return card;
  }

  async update(id: string, updateCardDto: Partial<CreateCardDto>): Promise<Card> {
    const card = await this.findOne(id);
    const updatedCard = this.cardRepository.merge(card, updateCardDto);
    return await this.cardRepository.save(updatedCard);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    await this.cardRepository.remove(card);
  }

  async findByCardNumber(cardNumber: string): Promise<Card[]> {
    return await this.cardRepository.find({
      where: { cardNumber: ILike(`%${cardNumber}%`) },
    });
  }

  async findBySet(setName: string): Promise<Card[]> {
    return await this.cardRepository.find({
      where: { set: ILike(`%${setName}%`) },
    });
  }
}