import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class StudyLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAddress: string; // 用户钱包地址 [cite: 212]

  @Column()
  courseId: number; // 关联的课程 ID [cite: 212]

  @CreateDateColumn()
  startTime: Date; // 系统自动记录开始学习的时间 [cite: 134]

  @UpdateDateColumn()
  lastHeartbeat: Date; // 系统自动更新最后一次心跳时间 

  @Column({ default: false })
  isCompleted: boolean; // 标记是否已经结算并领取过积分 [cite: 212]
}