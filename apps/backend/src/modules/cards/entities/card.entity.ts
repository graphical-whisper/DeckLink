import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CardLanguage } from '../enums/card-language.enum';
import { CardCondition } from '../enums/card-condition.enum';
import { CardRarity } from '../enums/card-rarity.enum';
import { OfferCard } from '../../market/entities/offer-card.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  cardNumber!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CardLanguage, default: CardLanguage.ENGLISH })
  language!: CardLanguage;

  @Column({ type: 'enum', enum: CardCondition, default: CardCondition.NEAR_MINT })
  condition!: CardCondition;

  @Column({ type: 'enum', enum: CardRarity, default: CardRarity.COMMON })
  rarity!: CardRarity;

  @Column()
  set!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'json', nullable: true })
  validVersions?: string[];

  @Column({ default: false })
  alternateArt!: boolean;

  @Column({ type: 'text' })
  description!: string;

  @OneToMany(() => OfferCard, offerCard => offerCard.card)
  offerCards!: OfferCard[];

  @CreateDateColumn()
  createdAt!: Date;

  constructor(partial: Partial<Card>) {
    Object.assign(this, partial);
  }
}