import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAccount, AccountSchema } from './entities/account.entity';


@Injectable()
export class AccountsService {
    constructor(@InjectRepository(AccountSchema)
    private accountRepository:Repository<IAccount>,
){}

    async findOneByEmailWithPassword (email: string): Promise<IAccount | null>{
        // cột nào bị ẩn thì dùng queryBuilder addSelect để chọn gọi data
        const account = await this.accountRepository.createQueryBuilder('account').addSelect('account.password_hash').where('account.email = :email', {email}).getOne(); //account la ten bi danh tu tao
        return account;
    }
    async findOneById(id: number): Promise<IAccount|null>{
        return this.accountRepository.findOneBy({account_id: id})
    }
    async findOneEmail(email: string): Promise<IAccount | null>{
        const acc = await this.accountRepository.createQueryBuilder('account').where('account.email = :email', {email}).getOne()
        return acc
    }
    async create(payload: Partial<IAccount>): Promise<IAccount> {
        const entity = this.accountRepository.create(payload as IAccount);
        const saved = await this.accountRepository.save(entity);
        return saved;
      }

}
