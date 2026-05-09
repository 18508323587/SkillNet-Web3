import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Redemption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAddress: string; // 谁兑换的（钱包地址）

  @Column()
  itemName: string; // 兑换了什么商品

  @Column()
  cost: number; // 花了多少积分

  @CreateDateColumn()
  createdAt: Date; // 兑换时间（数据库自动生成）
}