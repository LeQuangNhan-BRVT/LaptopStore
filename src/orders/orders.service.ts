import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm'; // cai nay dung de quan ly Transaction
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from 'src/products/products.service';
import { OrderSchema, IOrder } from './entities/order.entity';
import { IOrderItem, OrderItemSchema } from './entities/order-item.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
        final_amount: totalAmount + createOrderDto.shipping_fee, //Them % khuyen mai sau
        notes: createOrderDto.notes || null,
        status: 'pending',
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

  async updateStatus(orderId: number, status: string) {
    const order = await this.orderRepository.findOneBy({ order_id: orderId });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  async updateStatusByOrderCode(orderCode: string, status: string) {
    const order = await this.orderRepository.findOne({
      where: { order_code: orderCode },
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  async findByUser(userId: number) {
    return this.orderRepository.find({
      where: { user_id: userId },
      relations: ['order_items', 'order_items.product', 'payment_method'],
      order: { created_at: 'DESC' },
    });
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const query = this.orderRepository.createQueryBuilder('order');

    query.leftJoinAndSelect('order.user', 'user');
    query.leftJoinAndSelect('order.order_items', 'items');
    query.leftJoinAndSelect('items.product', 'product');
    query.leftJoinAndSelect('order.payment_method', 'payment');

    if (status) {
      query.where('order.status = :status', { status });
    }
    query.orderBy('order.created_at', 'DESC');
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
    order.status = 'cancelled';
    return this.orderRepository.save(order);
  }
}
