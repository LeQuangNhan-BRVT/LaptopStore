import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  ForbiddenException,
  BadRequestException, UseGuards
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('statistics')
@UseGuards(AuthGuard('jwt'))
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('revenue')
  async getRevenueStatistics(
    @Req() req: any,
    @Query('type') type: string,
    @Query('year') year?: number,
    @Query('from_year') fromYear?: number,
    @Query('to_year') toYear?: number,
    @Query('week') week?: number,
    @Query('month') month?: number,
  ) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Bạn không có quyền xem doanh thu!');
    }
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const yearNum = year ? Number(year) : currentYear;
    switch (type) {
      case 'month':
        return this.statisticsService.getRevenueByMonth(yearNum || currentYear);
      case 'quarter':
        return this.statisticsService.getRevenueByQuarter(yearNum || currentYear);
      case 'year':
        const to = toYear ? Number(toYear) : currentYear;
        const from = fromYear ? Number(fromYear) : to - 4; //lay 5 năm gần nhất
        return this.statisticsService.getRevenueByYear(from, to)
      case 'week':
        const seletedMonth = month ? Number(month):currentMonth
        return this.statisticsService.getRevenueByDaysInSpecificWeek(yearNum, seletedMonth, Number(week))
      default:
        throw new BadRequestException('Kiểu thống kê (month/quarter/year) không hợp lệ')
    }
  }
}
