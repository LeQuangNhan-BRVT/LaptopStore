import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderSchema, IOrder } from 'src/orders/entities/order.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(OrderSchema)
    private readonly orderRepository: Repository<IOrder>,
  ) {}

  private readonly validStatus = ['delivered'];

  async getRevenueByMonth(year: number) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('MONTH(order.created_at)', 'month')
      .addSelect('SUM(order.final_amount)', 'revenue')
      .addSelect('COUNT(order.order_id)', 'order_count')
      .where('YEAR(order.created_at) = :year', { year })
      .andWhere('order.status IN (:...statuses)', {
        statuses: this.validStatus,
      })
      .groupBy('MONTH(order.created_at)')
      .orderBy('month', 'ASC')
      .getRawMany();

    //length = 12 la vi SQL ko tra ve du lieu thang ko co doanh thu, can phai laay het 12 thang
    const filledData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = result.find((item) => parseInt(item.month) === month);
      return {
        label: `Tháng ${month}`,
        revenue: found ? parseInt(found.revenue) : 0,
        order_count: found ? parseInt(found.order_count) : 0,
      };
    });
    return filledData;
  }

  async getRevenueByQuarter(year: number) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('QUARTER(order.created_at)', 'quarter')
      .addSelect('SUM(order.final_amount)', 'revenue')
      .addSelect('COUNT(order.order_id)', 'order_count')
      .where('YEAR(order.created_at) = :year', { year })
      .andWhere('order.status IN (:...statuses)', {
        statuses: this.validStatus,
      })
      .groupBy('QUARTER(order.created_at)')
      .orderBy('quarter', 'ASC')
      .getRawMany();

    const filledData = Array.from({ length: 4 }, (_, i) => {
      const quarter = i + 1;
      const found = result.find((item) => parseInt(item.quarter) === quarter);
      return {
        label: `Quý ${quarter}`,
        revenue: found ? parseInt(found.revenue) : 0,
        order_count: found ? parseInt(found.order_count) : 0,
      };
    });
    return filledData;
  }

  async getRevenueByYear(fromYear: number, toYear: number) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('YEAR(order.created_at)', 'year')
      .addSelect('SUM(order.final_amount)', 'revenue')
      .addSelect('COUNT(order.order_id)', 'order_count')
      .where(
        'YEAR(order.created_at) >= :fromYear AND YEAR(order.created_at) <= :toYear',
        { fromYear, toYear },
      )
      .andWhere('order.status IN (:...statuses)', {
        statuses: this.validStatus,
      })
      .groupBy('YEAR(order.created_at)')
      .orderBy('year', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      label: `Năm ${item.year}`,
      revenue: parseInt(item.revenue),
      order_count: parseInt(item.order_count),
    }));
  }


  async getRevenueByDaysInSpecificWeek(year: number, month: number, weekNumber: number) {
    // Tạo ngày đầu tháng để làm mốc so sánh tuần
    const firstDayOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.created_at)', 'date') // Lấy ngày cụ thể (VD: 2024-12-10)
      .addSelect('DAYOFWEEK(order.created_at)', 'weekday') // Lấy thứ (1=CN, 2=Thứ 2...)
      .addSelect('SUM(order.final_amount)', 'revenue')
      .addSelect('COUNT(order.order_id)', 'order_count')
      .where('YEAR(order.created_at) = :year', { year })
      .andWhere('MONTH(order.created_at) = :month', { month })
      .andWhere('order.status IN (:...statuses)', { statuses: this.validStatus })
      // Công thức: Tuần của ngày hiện tại - Tuần của ngày đầu tháng + 1
      // WEEK(date, 1): Mode 1 nghĩa là tuần bắt đầu từ Thứ 2
      .andWhere(
        '(WEEK(order.created_at, 1) - WEEK(:firstDay, 1) + 1) = :weekNumber',
        { firstDay: firstDayOfMonth, weekNumber },
      )
      .groupBy('DATE(order.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    

    // MySQL DAYOFWEEK trả về: 1=CN, 2=T2, ..., 7=T7
    const standardWeek = [
      { id: 2, label: 'Thứ 2' },
      { id: 3, label: 'Thứ 3' },
      { id: 4, label: 'Thứ 4' },
      { id: 5, label: 'Thứ 5' },
      { id: 6, label: 'Thứ 6' },
      { id: 7, label: 'Thứ 7' },
      { id: 1, label: 'Chủ nhật' },
    ];

    const filledData = standardWeek.map((day) => {
      // Tìm trong kết quả xem có ngày này không
      const found = result.find((item) => item.weekday === day.id);
      return {
        label: day.label,
        date: found ? this.formatDate(found.date) : null,
        revenue: found ? parseInt(found.revenue) : 0,
        order_count: found ? parseInt(found.order_count) : 0,
      };
    });

    return filledData;
  }

  private formatDate(dateStr: string | Date): string {
     const date = new Date(dateStr);
     return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  async getRevenueByDay() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('DAYOFWEEK(order.created_at)', 'weekday')
      .addSelect('SUM(order.final_amount)', 'revenue')
      .addSelect('COUNT(order.order_id)', 'order_count')
      .where('order.status IN (:...statuses)', { statuses: this.validStatus })
      .groupBy('DAYOFWEEK(order.created_at)')
      .orderBy('weekday', 'ASC')
      .getRawMany();

    const weekdays = [
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];
    return result.map((item) => ({
      label: weekdays[item.weekday - 1], // vì MySQL: 1=CN, 2=Thứ 2
      revenue: parseInt(item.revenue),
      order_count: parseInt(item.order_count),
    }));
  }
}
