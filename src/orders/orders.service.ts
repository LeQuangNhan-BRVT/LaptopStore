import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository, Brackets } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from 'src/products/products.service';
import { OrderSchema, IOrder } from './entities/order.entity';
import { IOrderItem, OrderItemSchema } from './entities/order-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrderStatus,
  VALID_TRANSITIONS,
  VALID_TRANSITIONS_COD,
} from './entities/order.entity';
import { ProductSchema } from 'src/products/entities/product.entity';

export interface FindAllOrderParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string; 
  payment_method_id?: number; 
  start_date?: string; 
  end_date?: string;
}
@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    private productsService: ProductsService,
    @InjectRepository(OrderSchema)
    private orderRepository: Repository<IOrder>,
    @InjectRepository(OrderItemSchema)
    private orderItemRepository: Repository<IOrderItem>,
  ) {}
  async create(userId: number, createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItemsData: {
        product_id: number;
        quantity: number;
        price_at_purchase: number;
      }[] = [];
      for (const itemDto of createOrderDto.items) {
        const product = await this.productsService.findOne(itemDto.product_id);
        if (!product) {
          throw new BadRequestException(
            `Sản phẩm ID ${itemDto.product_id} không tồn tại`,
          );
        }
        if (product.quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${product.name} không đủ hàng`,
          );
        }
        const price = Number(product.sale_price ?? product.price);
        totalAmount += price * itemDto.quantity;

        orderItemsData.push({
          product_id: product.product_id,
          quantity: itemDto.quantity,
          price_at_purchase: price,
        });
        //cap nhat lai so luong san pham
        const newQuantity = (product.quantity =
          product.quantity - itemDto.quantity);
        await queryRunner.manager.update('products', product.product_id, {
          quantity: newQuantity,
        });
      }
      //tao ma don hang
      const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      //luu vao db
      const newOrder = queryRunner.manager.create(OrderSchema, {
        user_id: userId,
        order_code: orderCode,
        shipping_address: createOrderDto.shipping_address,
        payment_method_id: createOrderDto.payment_method_id,
        shipping_fee: createOrderDto.shipping_fee,
        total_amount: totalAmount,
        final_amount: totalAmount + createOrderDto.shipping_fee,
        notes: createOrderDto.notes || null,
        status: OrderStatus.PENDING, //pending là chờ xử lý xong
      });
      const savedOrder = await queryRunner.manager.save(OrderSchema, newOrder);
      //luu data vao bang order_items
      const itemsToSave = orderItemsData.map((item) => {
        return queryRunner.manager.create(OrderItemSchema, {
          ...item,
          order_id: savedOrder.order_id,
        });
      });
      await queryRunner.manager.save(OrderItemSchema, itemsToSave);
      //commit transaction
      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findOneByCode(code: string) {
    return this.orderRepository.findOne({ where: { order_code: code } });
  }

  //admin
  async updateStatus(orderId: number, newStatus: OrderStatus) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ['order_items'],
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    let ruleTransition;
    if (order.payment_method_id === 1) {
      ruleTransition = VALID_TRANSITIONS_COD;
    } else {
      ruleTransition = VALID_TRANSITIONS;
    }

    const allowedStatuses = ruleTransition[order.status as OrderStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      const method = order.payment_method_id === 1 ? 'COD' : 'Online';
      throw new BadRequestException(
        `Đơn hàng ${method} đang ở "${order.status}" không thể chuyển sang "${newStatus}".`,
      );
    }

    if (newStatus === OrderStatus.CANCELLED) {
      return this.cancelAndRestoreStock(orderId);
    }
    order.status = newStatus;
    return this.orderRepository.save(order);
  }

  async updateStatusByOrderCode(orderCode: string, status: string) {
    const order = await this.orderRepository.findOne({
      where: { order_code: orderCode },
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    order.status = status as OrderStatus;
    return this.orderRepository.save(order);
  }

  async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status: string = '',
    sortBy: string = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const query = this.orderRepository.createQueryBuilder('order');
    query.leftJoinAndSelect('order.user', 'user');
    query.leftJoinAndSelect('order.order_items', 'items');
    query.leftJoinAndSelect('items.product', 'product');
    query.leftJoinAndSelect('order.payment_method', 'payment');
    query.where('order.user_id = :userId', { userId });
    if (status && status !== '') {
      query.andWhere('order.status = :status', { status });
    }

    const sortableColumns = ['created_at', 'final_amount', 'status'];
    if (sortBy === 'payment_method') {
      query.orderBy('payment.name', order);
    } else if (sortableColumns.includes(sortBy)) {
      query.orderBy(`order.${sortBy}`, order);
    } else {
      query.orderBy('order.created_at', 'DESC');
    }

    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    const safeData = data.map((order) => {
      if (order.user) {
        const { password_hash, ...safeData } = order.user;
        return { ...order, user: safeData };
      }
      return order;
    });
    return {
      data: safeData,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        last_page: Math.ceil(total / limit),
      },
    };
  }

  // async findAll(
  //   page: number = 1,
  //   limit: number = 10,
  //   status?: string,
  //   sortBy: string = 'created_at',
  //   order: 'ASC' | 'DESC' = 'DESC',
  // ) {
  //   const query = this.orderRepository.createQueryBuilder('order');

  //   query.leftJoinAndSelect('order.user', 'user');
  //   query.leftJoinAndSelect('order.order_items', 'items');
  //   query.leftJoinAndSelect('items.product', 'product');
  //   query.leftJoinAndSelect('order.payment_method', 'payment');

  //   if (status) {
  //     query.where('order.status = :status', { status });
  //   }
  //   const sortableColumns = ['created_at', 'final_amount', 'status'];
  //   if (sortBy === 'payment_method') {
  //     query.orderBy('payment.name', order);
  //   } else if (sortableColumns.includes(sortBy)) {
  //     query.orderBy(`order.${sortBy}`, order);
  //   } else {
  //     query.orderBy('order.created_at', 'DESC');
  //   }
  //   query.skip((page - 1) * limit).take(limit);
  //   const [data, total] = await query.getManyAndCount();

  //   const safeData = data.map((order) => {
  //     if (order.user) {
  //       const { password_hash, ...safeData } = order.user;
  //       return { ...order, user: safeData };
  //     }
  //     return order;
  //   });
  //   return {
  //     data: safeData,
  //     meta: {
  //       total,
  //       page: Number(page),
  //       limit: Number(limit),
  //       last_page: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async findAll(params: FindAllOrderParams) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
      payment_method_id,
      start_date,
      end_date,
    } = params;

    const query = this.orderRepository.createQueryBuilder('order');

    query.leftJoinAndSelect('order.user', 'user');
    query.leftJoinAndSelect('order.order_items', 'items');
    query.leftJoinAndSelect('items.product', 'product');
    query.leftJoinAndSelect('order.payment_method', 'payment');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (payment_method_id) {
      query.andWhere('order.payment_method_id = :pmId', {
        pmId: payment_method_id,
      });
    }

    // Dùng Brackets để bọc điều kiện OR lại, tránh xung đột với các điều kiện AND khác
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('order.order_code LIKE :search', { search: `%${search}%` })
            .orWhere('user.full_name LIKE :search', { search: `%${search}%` })
            .orWhere('user.phone_number LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    //Lọc theo khoảng thời gian
    if (start_date) {
      // Ví dụ: 2024-01-01 -> So sánh >= 2024-01-01 00:00:00
      query.andWhere('order.created_at >= :startDate', {
        startDate: `${start_date} 00:00:00`,
      });
    }

    if (end_date) {
      // Ví dụ: 2024-01-01 -> x <= 2024-01-01 23:59:59
      query.andWhere('order.created_at <= :endDate', {
        endDate: `${end_date} 23:59:59`,
      });
    }

    //sắp xếp
    const sortableColumns = ['created_at', 'final_amount', 'status'];
    if (sortBy === 'payment_method') {
      query.orderBy('payment.name', sortOrder);
    }
    // Nếu sort theo các cột trong bảng order
    else if (sortableColumns.includes(sortBy)) {
      query.orderBy(`order.${sortBy}`, sortOrder);
    } else {
      query.orderBy('order.created_at', 'DESC');
    }

    query.skip((Number(page) - 1) * Number(limit)).take(Number(limit));

    const [data, total] = await query.getManyAndCount();

    const safeData = data.map((order) => {
      if (order.user) {
        const { password_hash, reset_token, ...safeUser } = order.user; // Loại bỏ password, token
        return { ...order, user: safeUser };
      }
      return order;
    });

    return {
      data: safeData,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        last_page: Math.ceil(total / Number(limit)),
      },
    };
  }
  //admin
  async cancelAndRestoreStock(orderId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(OrderSchema, {
        where: { order_id: orderId },
        relations: ['order_items'], lock: { mode: 'pessimistic_write' },
      });
      if (
        !order ||
        ['cancelled', 'paid', 'delivered', 'shipped'].includes(order.status)
      ) {
        await queryRunner.rollbackTransaction();
        return;
      }
      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(OrderSchema, order);

      for (const item of order.order_items!) {
        await queryRunner.manager.increment(
          ProductSchema,
          { product_id: item.product_id },
          'quantity',
          item.quantity,
        );
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrderByUser(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException('Không có đơn hàng nào như vậy');
    }
    if (order.user_id !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền hủy đơn hàng của người này',
      );
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Không được hủy đơn hàng đã xử lý xong');
    }
    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }
}
