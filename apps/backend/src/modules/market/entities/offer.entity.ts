import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OfferCard } from './offer-card.entity';
import { OfferType } from '../enums/offer-type.enum';
import { OfferStatus } from '../enums/offer-status.enum';
import { BundlePreference } from '../enums/bundle-preference.enum';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user: { offers: any; }) => user.offers)
  user!: User;

  @Column({ type: 'enum', enum: OfferType })
  type!: OfferType;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.ACTIVE })
  status!: OfferStatus;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: BundlePreference, nullable: true })
  bundlePreference?: BundlePreference;

  @Column({ default: false })
  isBundle!: boolean;

  @Column({ default: true })
  allowSeparateSale!: boolean;

  @Column({ type: 'int', default: 30 })
  expirationDays!: number;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ default: 0 })
  views!: number;

  @Column({ default: false })
  hasAd!: boolean;

  @Column({ type: 'int', default: 0 })
  adImpressions!: number;

  @OneToMany(() => OfferCard, offerCard => offerCard.offer, { cascade: true })
  offerCards!: OfferCard[];

  @OneToMany(() => Order, order => order.offer)
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  getTotalPrice(): number {
    if (!this.offerCards) return 0;
    return this.offerCards.reduce((total, offerCard) => {
      return total + (offerCard.pricePerUnit * offerCard.quantity);
    }, 0);
  }

  getTotalQuantity(): number {
    if (!this.offerCards) return 0;
    return this.offerCards.reduce((total, offerCard) => total + offerCard.quantity, 0);
  }
}