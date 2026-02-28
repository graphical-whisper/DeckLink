import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../../user/entities/user.entity';

@Entity('user_ad_preferences')
export class UserAdPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.adPreferences)
  @JoinColumn()
  user: User;

  @Column({ type: 'int', default: 0 })
  adsViewedToday: number; // Límite diario de anuncios

  @Column({ type: 'int', default: 0 })
  adsViewedThisMonth: number; // Límite mensual de anuncios

  @Column({ type: 'timestamp', nullable: true })
  lastAdViewDate?: Date;

  @Column({ type: 'boolean', default: true })
  showAds: boolean; // Si el usuario quiere ver anuncios

  @Column({ type: 'json', nullable: true })
  adCategories: string[]; // Categorías de anuncios preferidas

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}