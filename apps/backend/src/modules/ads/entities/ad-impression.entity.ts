import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../../user/entities/user.entity';
import { AdConfig } from './ad-config.entity';

@Entity('ad_impressions')
export class AdImpression {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdConfig)
  adConfig: AdConfig;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column({ type: 'enum', enum: AdPlacement })
  placement: AdPlacement;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  revenue?: number; // Ingreso generado por el anuncio

  @Column({ nullable: true })
  adProviderId?: string; // ID del anuncio en la plataforma del proveedor

  @Column({ default: false })
  isClick: boolean;

  @CreateDateColumn()
  createdAt: Date;
}