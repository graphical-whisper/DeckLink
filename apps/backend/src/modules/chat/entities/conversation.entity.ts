import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Message } from './message.entity';
import { Order } from '../../orders/entities/order.entity';
import { Offer } from '../../market/entities/offer.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  buyer: User;

  @ManyToOne(() => User)
  seller: User;

  @ManyToOne(() => Offer, { nullable: true })
  offer?: Offer;

  @OneToOne(() => Order, order => order.conversation, { nullable: true })
  @JoinColumn()
  order?: Order;

  @Column()
  title: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  hasUnreadMessages: boolean;

  @ManyToOne(() => User, { nullable: true })
  lastMessageBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}