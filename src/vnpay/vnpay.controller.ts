import { Controller, Post, Get, Req, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { VnpayService } from './vnpay.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/entities/order.entity';
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create_payment_url')
  createPaymentUrl(@Req() req: any, @Body() body: any) {
    req.body = body;
    const url = this.vnpayService.createPaymentUrl(req);
    return { data: url };
  }

  // Endpoint xử lý callback từ VNPay
  @Get('vnpay_return')
  async vnpayReturn(@Query() query: any, @Res() res: any) {
    console.log('=== VNPAY RETURN CALLBACK ===');
    console.log('Query params:', query);

    const result = this.vnpayService.verifyReturnUrl(query);

    console.log('=== VERIFICATION RESULT ===');
    console.log(result);

    const vnpauUrlReturn = this.configService.get<string>('FRONTEND_URL');

    const frontendUrl = `${vnpauUrlReturn}/payment-result`;

    if (result.isValid && result.responseCode === '00') {
      
      // Thanh toán thành công
      await this.ordersService.updateStatusByOrderCode(result.orderId, OrderStatus.PAID);
      
      return res.redirect(
        `${frontendUrl}?payment=success&order=${result.orderId}&amount=${result.amount}`,
      );
    } else if (result.responseCode === '24') {
      await this.ordersService.updateStatusByOrderCode(result.orderId, OrderStatus.CANCELLED);
      return res.redirect(
        `${frontendUrl}?payment=cancel&order=${result.orderId}&message=${encodeURIComponent('Bạn đã hủy giao dịch')}`,
      );
    } else {
      // Lỗi khác
      const errorMsg = this.getResponseMessage(result.responseCode);
      return res.redirect(
        `${frontendUrl}?payment=error&order=${result.orderId}&message=${encodeURIComponent(errorMsg)}`,
      );
    }
  }

  // Hàm map response code sang message
  private getResponseMessage(code: string): string {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    };

    return messages[code] || 'Giao dịch thất bại';
  }
}
