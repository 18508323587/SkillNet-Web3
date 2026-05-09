import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Redemption } from '../entities/redemption.entity'; // 引入兑换表

@Module({
  imports: [TypeOrmModule.forFeature([Redemption])], // 告诉数据库我们要用这张表
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}