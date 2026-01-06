import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAccount, AccountSchema } from './entities/account.entity';
import { UpdateStaffDto } from './entities/update.entity';
import * as bcrypt from 'bcrypt'
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountSchema)
    private accountRepository: Repository<IAccount>,
  ) {}

  async findOneByEmailWithPassword(email: string): Promise<IAccount | null> {
    // cột nào bị ẩn thì dùng queryBuilder addSelect để chọn gọi data
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .addSelect('account.password_hash')
      .where('account.email = :email', { email })
      .getOne(); //account la ten bi danh tu tao
    return account;
  }
  async findOneById(id: number): Promise<IAccount | null> {
    return this.accountRepository.findOneBy({ account_id: id });
  }
  async findOneEmail(email: string): Promise<IAccount | null> {
    const acc = await this.accountRepository
      .createQueryBuilder('account')
      .where('account.email = :email', { email })
      .getOne();
    return acc;
  }
  async create(payload: Partial<IAccount>): Promise<IAccount> {
    const entity = this.accountRepository.create(payload as IAccount);
    const saved = await this.accountRepository.save(entity);
    return saved;
  }
  async update(id: number, updateData: any) {
    const staff = await this.accountRepository.findOneBy({ account_id: id });
    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên này');
    }


    if (updateData.password && updateData.password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
    }

    delete updateData.password;
    delete updateData.account_id; 
    delete updateData.email; 

    await this.accountRepository.update(id, updateData);
    return this.accountRepository.findOneBy({ account_id: id });
  }

  // 3. Xóa nhân viên
  async remove(id: number) {
    const staff = await this.accountRepository.findOneBy({ account_id: id });
    if (!staff) throw new NotFoundException('Không tìm thấy tài khoản');
    
    // Có thể dùng soft delete (update is_active = false) hoặc xóa hẳn
    return this.accountRepository.delete(id);
  }

  async findAll(roleId?: number): Promise<IAccount[]> {
    const query = this.accountRepository.createQueryBuilder('account');
    
    if (roleId) {
      query.where('account.role_id = :roleId', { roleId });
    }
    
    // Ẩn mật khẩu khi trả về danh sách
    query.select(['account.account_id', 'account.full_name', 'account.email', 'account.phone_number', 'account.role_id', 'account.is_active', 'account.created_at']);
    
    return query.getMany();
  }


}
