import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// 1. 确保这里引入了所有实体
import { Course } from './entities/course.entity';
import { StudyLog } from './entities/study-log.entity';
import { Redemption } from './entities/redemption.entity';
import { StudyModule } from './study/study.module';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'skillnet_admin',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_DATABASE || 'skillnet_db',
      // 2. 这里的数组必须包含你新建的所有实体类名
      entities: [Course, StudyLog, Redemption], 
      synchronize: true, // 保持开启，它会自动根据你的文件在数据库建表
    }),
    StudyModule,
    ShopModule,
  ],
})
export class AppModule {}