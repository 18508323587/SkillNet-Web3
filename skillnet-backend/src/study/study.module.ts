import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyService } from './study.service';
import { StudyController } from './study.controller';
import { StudyLog } from '../entities/study-log.entity';
import { Course } from '../entities/course.entity'; // 确保引入了 Course

@Module({
  imports: [
    // 【关键修复】在这里把 Course 也加进去
    TypeOrmModule.forFeature([StudyLog, Course]) 
  ],
  controllers: [StudyController],
  providers: [StudyService],
})
export class StudyModule {}