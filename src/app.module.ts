import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from './brands/brands.module';

import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { AccountsModule } from './accounts/accounts.module';
import { RolesModule } from './roles/roles.module';

import { OrdersModule } from './orders/orders.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { ShippingModule } from './shipping/shipping.module';
import { VnpayModule } from './vnpay/vnpay.module';
import { SepayModule } from './sepay/sepay.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      
    }),
    ServeStaticModule.forRoot({
       rootPath: join(__dirname, '..', 'uploads'),
       serveRoot: '/uploads' 
    }),
    ProductsModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    
    CategoriesModule,
    TagsModule,
    AccountsModule,
    RolesModule,
    
    OrdersModule,
    ShippingModule,
    VnpayModule,
    SepayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
