import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // 【新增】：存放视频链接的字段
 @Column({ nullable: true })
  videoUrl: string;

  @Column()
  baseReward: number;

  @Column()
  difficulty: number;

  @Column()
  minStudyTime: number;

// 注意这里变成了两个参数，用逗号隔开
  @Column('simple-array', { nullable: true })
  questions: string[];

  @Column({ nullable: true })
  answerHash: string;
}