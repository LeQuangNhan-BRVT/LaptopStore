import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient } from 'sepay-pg-node';

@Injectable()
export class SepayService {
  private client: SePayPgClient;
  private readonly logger = new Logger(SepayService.name);

  constructor(private readonly configService: ConfigService) {
    const env =
      this.configService.get<'sandbox' | 'production'>('SEPAY_ENVIRONMENT') ||
      'sandbox';
    const merchantId =
      this.configService.get<string>('SEPAY_MERCHANT_ID') || '';
    const secretKey = this.configService.get<string>('SEPAY_SECRET_KEY') || '';

    // 🔥 Log các biến môi trường
    this.logger.log(`SEPAY_ENVIRONMENT = ${env}`);
    this.logger.log(`SEPAY_MERCHANT_ID = ${merchantId}`);
    this.logger.log(
      `SEPAY_SECRET_KEY = ${secretKey ? '***HIDDEN***' : 'EMPTY'}`,
    );

    this.client = new SePayPgClient({
      env,
      merchant_id: merchantId,
      secret_key: secretKey,
    });
  }

  /**
   * Khởi tạo checkout cho SePay
   */
  async initCheckout(orderCode: string, amount: number, description: string) {
    const merchant = this.configService.get<string>('SEPAY_MERCHANT_ID');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    // 🔥 Log kiểm tra URL redirect
    this.logger.log(`Frontend URL = ${frontendUrl}`);
    this.logger.log(
      `Success URL = ${frontendUrl}/payment-result?status=success`,
    );
    this.logger.log(`Error URL   = ${frontendUrl}/payment-result?status=error`);
    this.logger.log(
      `Cancel URL  = ${frontendUrl}/payment-result?status=cancel`,
    );

    const fields = this.client.checkout.initOneTimePaymentFields({
      merchant,
      currency: 'VND',
      order_amount: amount,
      operation: 'PURCHASE',
      order_description: description,
      order_invoice_number: orderCode,
      success_url: `${backendUrl}/payment/sepay/callback?status=success&order=${orderCode}`,
      error_url: `${backendUrl}/payment/sepay/callback?status=error&order=${orderCode}`,
      cancel_url: `${backendUrl}/payment/sepay/callback?status=cancel&order=${orderCode}`,
    });

    const checkoutUrl = this.client.checkout.initCheckoutUrl();

    this.logger.log('Generated SePay checkout URL: ' + checkoutUrl);
    this.logger.debug('Checkout fields: ' + JSON.stringify(fields, null, 2));

    return { checkoutUrl, formFields: fields };
  }

  /**
   * Tra cứu đơn qua SePay
   */
  async getOrder(invoiceNumber: string) {
    try {
      const result = await this.client.order.retrieve(invoiceNumber);
      return result;
    } catch (error) {
      this.logger.error('Error retrieving SePay order', error);
      throw error;
    }
  }
  verifyIPNSignature(data: any): boolean {
    try {
      // SePay sẽ gửi signature trong header hoặc body
      // Implement theo docs của SePay
      // Ví dụ: so sánh HMAC SHA256
      return true; // Tạm thời return true, cần implement theo docs
    } catch (error) {
      this.logger.error('IPN signature verification failed', error);
      return false;
    }
  }
}
