import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Offer } from './offer.entity';
import { Card } from '../../cards/entities/card.entity';
import { CardCondition } from '../../cards/enums/card-condition.enum';
import { CardLanguage } from '../../cards/enums/card-language.enum';

@Entity('offer_cards')
export class OfferCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Offer, offer => offer.offerCards, { onDelete: 'CASCADE' })
  offer!: Offer;

  @ManyToOne(() => Card)
  card!: Card;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerUnit!: number;

  @Column({ type: 'enum', enum: CardCondition, nullable: true })
  condition?: CardCondition;

  @Column({ type: 'enum', enum: CardLanguage, nullable: true })
  language?: CardLanguage;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}