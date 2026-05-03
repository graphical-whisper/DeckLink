import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Offer } from '../../market/entities/offer.entity';
import { Conversation } from '../../chat/entities/conversation.entity';
import { OrderCard } from './order-card.entity';

export enum OrderStatus {
  PENDING = 'pending', // Creada pero no confirmada
  CONFIRMED = 'confirmed', // Ambas partes confirmaron
  IN_PROGRESS = 'in_progress', // En proceso de envío/pago
  COMPLETED = 'completed', // Transacción completada
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.buyOrders)
  buyer: User;

  @ManyToOne(() => User, user => user.sellOrders)
  seller: User;

  @ManyToOne(() => Offer, offer => offer.orders)
  offer: Offer;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  deliveryStatus: DeliveryStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  buyerNotes?: string;

  @Column({ type: 'text', nullable: true })
  sellerNotes?: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress?: string;

  @Column({ type: 'text', nullable: true })
  contactInfo?: string; // Datos de contacto si no hay chat

  // Confirmaciones
  @Column({ default: false })
  buyerConfirmed: boolean;

  @Column({ default: false })
  sellerConfirmed: boolean;

  // Timestamps para seguimiento
  @Column({ type: 'timestamp', nullable: true })
  buyerConfirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sellerConfirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  // Relaciones
  @OneToMany(() => OrderCard, orderCard => orderCard.order, { cascade: true })
  orderCards: OrderCard[];

  @OneToOne(() => Conversation, conversation => conversation.order)
  conversation: Conversation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Métodos helpers
  isBothConfirmed(): boolean {
    return this.buyerConfirmed && this.sellerConfirmed;
  }

  canBeMarkedCompleted(): boolean {
    return this.paymentStatus === PaymentStatus.PAID && 
           this.deliveryStatus === DeliveryStatus.DELIVERED;
  }
}