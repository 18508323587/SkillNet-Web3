import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 【新增】开启 CORS（跨域资源共享）
  // 这行代码告诉浏览器：允许任何前端页面来请求我的数据，不要拦截！
  app.enableCors();

  await app.listen(3000);
}
bootstrap();