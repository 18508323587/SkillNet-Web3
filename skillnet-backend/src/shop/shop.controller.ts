import { Controller, Post, Body } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  // 下单接口
  @Post('redeem')
  async redeem(@Body() body: any) {
    return await this.shopService.redeemItem(body);
  }

  // 🌟【新增】：查历史订单接口 (对应前端 http://localhost:3000/shop/history)
  @Post('history')
  async getHistory(@Body() body: any) {
    return await this.shopService.getHistory(body.userAddress);
  }
}