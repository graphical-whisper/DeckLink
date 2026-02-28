import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AdProvider {
  GOOGLE_ADS = 'google_ads',
  FACEBOOK_ADS = 'facebook_ads',
  UNITY_ADS = 'unity_ads',
  ADMOB = 'admob',
  CUSTOM = 'custom'
}

export enum AdPlacement {
  OFFER_CREATION = 'offer_creation',
  OFFER_LIST = 'offer_list',
  SEARCH_RESULTS = 'search_results',
  PROFILE_VIEW = 'profile_view',
  ORDER_CONFIRMATION = 'order_confirmation'
}

@Entity('ad_configs')
export class AdConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AdProvider })
  provider: AdProvider;

  @Column({ type: 'enum', enum: AdPlacement })
  placement: AdPlacement;

  @Column()
  adUnitId: string; // ID del anuncio de la plataforma

  @Column()
  adName: string; // Nombre descriptivo del anuncio

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  frequency: number; // Cada cuántas acciones mostrar el anuncio

  @Column({ type: 'json', nullable: true })
  targeting: {
    minUserRating?: number;
    excludedUserIds?: string[];
    countries?: string[];
    languages?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;
}