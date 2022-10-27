import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppGateway } from './app.gateway';
import { AuthModule } from './auth/auth.module';
import { AppErrorFilter } from './common/filter/app.filter';
import { AppInterceptor } from './common/interceptor/app.interceptor';
import { DeviceDetectorMiddleware } from './common/middleware/device-detector.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ConfigModule],
  providers: [
    AppGateway,
    {
      provide: APP_FILTER,
      useClass: AppErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceDetectorMiddleware).forRoutes('*');
  }
}
