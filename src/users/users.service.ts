import { NotFoundException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUser, UserSchema } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserSchema)
    private userRepository: Repository<IUser>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, keyword?: string){
    const queruy = this.userRepository.createQueryBuilder('user')

    if(keyword){
      queruy.where('user.email LIKE :keyword', {keyword: `${keyword}`})
    }
    queruy.orderBy('user.created_at', 'DESC')
    queruy.skip((page-1)*limit).take(limit)
    const [users, total] = await queruy.getManyAndCount()
    const safeUsers = users.map(u =>{
      const {password_hash, ...rest} = u
      return rest
    })

    return {
      data: safeUsers,
      meta: {
        total, page: Number(page), limit: Number(limit), last_page: Math.ceil(total/limit)
      }
    }

  }

  async toggleLock(userId: number){
    const user = await this.userRepository.findOneBy({user_id: userId})
    if (!user) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }
    //che do khoa, dao nguoc trang thai la duoc
    user.is_active = !user.is_active
    return this.userRepository.save(user)
  }


  async findOneByEmail(email: string): Promise<IUser|null>{
    return this.userRepository.findOneBy({email: email})
  }
  async findOneByEmailWithPassword(email: string): Promise<IUser|null>{
    const user = await this.userRepository
      .createQueryBuilder('user') // 'user' là bí danh
      .addSelect('user.password_hash') // Yêu cầu TypeORM thêm cột bị ẩn
      .where('user.email = :email', { email })
      .getOne();

    return user;
  }
  async create(payload: Partial<IUser>): Promise<IUser> {
    const entity = this.userRepository.create(payload as IUser);
    const saved = await this.userRepository.save(entity);
    return saved;
  }
  async findByProvider(provider: string, provider_id: string): Promise<IUser|null> {
    return this.userRepository.findOneBy({ provider, provider_id } as any);
  }
  async createFromProvider(payload: Partial<IUser>): Promise<IUser> {
    return this.create(payload);
  }
  async updateProviderByUserId(userId: number, provider: string, provider_id: string): Promise<IUser> {
    await this.userRepository.update({ user_id: userId } as any, { provider, provider_id } as any);
    const updated = await this.userRepository.findOneBy({ user_id: userId } as any);
    return updated as IUser;
  }
  async getById(userId: number): Promise<IUser|null> {
    return this.userRepository.findOneBy({ user_id: userId } as any);
  }
  async update(id: number, updateData: any) {
    if(!id){
      throw new Error('Người dùng có ID không tồn tại')
    }
    await this.userRepository.update(id, updateData);
    return this.getById(id);
  }
  async updateResetToken(id: number, token: string){
    if(!id){
      throw new Error('Người dùng có ID không tồn tại')
    }
    return await this.userRepository.update(id, {reset_token: token})
    
  }
  async findByResetToken(token: string): Promise<IUser | null> {
    return await this.userRepository.findOne({ 
        where: { reset_token: token } 
    });
}


async updatePasswordAndClearToken(userId: number, newPasswordHash: string) {
    await this.userRepository.update(userId, { 
        password_hash: newPasswordHash,
        reset_token: null // Xóa token đi
    });
}
}
