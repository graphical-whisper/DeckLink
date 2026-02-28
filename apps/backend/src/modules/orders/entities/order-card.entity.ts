import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Card } from '../../cards/entities/card.entity';

@Entity('order_cards')
export class OrderCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.orderCards, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Card)
  card: Card;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerUnit: number;

  @CreateDateColumn()
  createdAt: Date;
}