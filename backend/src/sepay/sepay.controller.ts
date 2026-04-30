import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  Res, 
  Req,
  Logger,
  HttpStatus 
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SepayService } from './sepay.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/entities/order.entity';

@Controller('payment/sepay')
export class SepayController {
  private readonly logger = new Logger(SepayController.name);

  constructor(
    private readonly sepayService: SepayService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

 
  @Post('create')
  async createSepay(@Body() dto: { invoiceNumber: string; amount: number }) {
    return this.sepayService.initCheckout(
      dto.invoiceNumber,
      dto.amount,
      `Thanh toán đơn hàng ${dto.invoiceNumber}`,
    );
  }


  @Get('callback')
  async handleCallback(
    @Query('status') status: string,
    @Query('order') orderCode: string,
    @Res() res: any,
  ) {
    this.logger.log(`SePay callback received - Status: ${status}, Order: ${orderCode}`);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Đường dẫn đích ở Frontend (File PaymentResultPage.vue)
    const redirectUrl = `${frontendUrl}/payment-result`; 

    try {
      // 1. Tìm đơn hàng trong DB
      const order = await this.ordersService.findOneByCode(orderCode);
      console.log("ORDER_CODE: ", order)
      if (!order) {
        this.logger.error(`Order not found: ${orderCode}`);
        // Redirect về trang lỗi nếu không tìm thấy đơn
        return res.redirect(`${redirectUrl}?status=error&message=OrderNotFound`);
      }

      // 2. Xử lý theo trạng thái trả về
      if (status === 'success') {
        
        await this.ordersService.updateStatus(order.order_id, OrderStatus.PAID);
        
        this.logger.log(`Order ${orderCode} updated to paid`);

       
        return res.redirect(`${redirectUrl}?status=success&orderCode=${orderCode}`);
      }

      if (status === 'cancel') {
        this.logger.warn(`Payment cancelled for order: ${orderCode}`);
        
        
        await this.ordersService.updateStatus(order.order_id, OrderStatus.CANCELLED);

        return res.redirect(`${redirectUrl}?status=cancel&orderCode=${orderCode}`);
      }

      // Trường hợp lỗi (error)
      this.logger.error(`Payment failed for order: ${orderCode}`);
      await this.ordersService.updateStatus(order.order_id, OrderStatus.CANCELLED); // Hoặc 'Failed'
      return res.redirect(`${redirectUrl}?status=error&orderCode=${orderCode}`);

    } catch (error) {
      this.logger.error(`Callback error: ${error.message}`, error.stack);
      // Redirect về trang lỗi chung
      return res.redirect(`${redirectUrl}?status=error&message=SystemError`);
    }
  }

 
  @Post('ipn')
  async handleIPN(
    @Body() body: any,
    @Req() req: any,
  ) {
    this.logger.log('IPN received from SePay');
    this.logger.debug(`IPN Body: ${JSON.stringify(body)}`);

    try {
   
      const isValid = this.sepayService.verifyIPNSignature(body);
      
      if (!isValid) {
        this.logger.error('Invalid IPN signature');
        return { 
          status: 'error', 
          message: 'Invalid signature' 
        };
      }

      
      const { order_invoice_number, status, amount } = body;

      this.logger.log(`IPN - Order: ${order_invoice_number}, Status: ${status}, Amount: ${amount}`);
      return { 
        status: 'success',
        message: 'IPN processed successfully' 
      };

    } catch (error) {
      this.logger.error(`IPN processing error: ${error.message}`, error.stack);
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }

  @Get('order/:invoiceNumber')
  async getOrderStatus(@Query('invoiceNumber') invoiceNumber: string) {
    try {
      const orderDetails = await this.sepayService.getOrder(invoiceNumber);
      return {
        success: true,
        data: orderDetails,
      };
    } catch (error) {
      this.logger.error(`Get order error: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}