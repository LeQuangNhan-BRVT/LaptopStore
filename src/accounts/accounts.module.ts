import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountSchema } from './entities/account.entity';


@Module({
	imports: [TypeOrmModule.forFeature([AccountSchema])],
	controllers: [AccountsController],
	providers: [AccountsService],
	exports: [AccountsService],
})
export class AccountsModule {}
