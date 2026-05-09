import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { StudyService } from './study.service';

@Controller('study')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  // 🚀 获取智能推荐课程接口
  @Post('recommend')
  async recommend(@Body() dto: any) {
    return this.studyService.recommend(dto);
  }

  // 🚀 提交答卷接口
  @Post('submit')
  async submit(@Body() dto: any) {
    return this.studyService.submit(dto);
  }

  // ==========================================
  // 🚀 新增：根据钱包地址查询积分余额接口
  // ==========================================
  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    return this.studyService.getBalance(address);
  }
}