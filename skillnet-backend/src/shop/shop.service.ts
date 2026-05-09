import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redemption } from '../entities/redemption.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Redemption)
    private redemptionRepo: Repository<Redemption>,
  ) {}

  // 1. 兑换商品并写入数据库
  async redeemItem(body: any) {
    const { userAddress, itemName, cost } = body;
    
    const record = this.redemptionRepo.create({
      userAddress,
      itemName,
      cost,
    });
    await this.redemptionRepo.save(record);

    console.log(`\n🚨 [老板来大单了！] 用户: ${userAddress}`);
    console.log(`🎁 刚刚花费 ${cost} 积分，兑换了【${itemName}】！\n`);

    return { success: true, message: '兑换已上链记录！' };
  }

  // 🌟【新增】：根据钱包地址查询兑换历史（按时间倒序）
  async getHistory(userAddress: string) {
    return await this.redemptionRepo.find({
      where: { userAddress },
      order: { createdAt: 'DESC' }, // DESC 代表最新的订单排在最前面
    });
  }
}