import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';
import moment from 'moment';

@Injectable()
export class VnpayService {
  constructor(private configService: ConfigService) {}

  createPaymentUrl(req: any) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

    // Detect IP
    let ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      '127.0.0.1';

    // Xử lý IPv6
    if (ipAddr && ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }
    if (ipAddr === '::1') {
      ipAddr = '127.0.0.1';
    }

    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
    let vnpUrl = this.configService.get<string>('VNPAY_URL');
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');

    console.log('=== VNPAY CONFIG ===');
    console.log('TMN_CODE:', tmnCode);
    console.log('HASH_SECRET:', secretKey);

    if (!tmnCode || !secretKey) {
      throw new Error('VNPAY cấu hình thiếu TMN_CODE hoặc HASH_SECRET');
    }

    const { amount, bankCode, orderId } = req.body;
    const locale = req.body.language || 'vn';

    let vnp_Params: any = {};

    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sort parameters
    vnp_Params = this.sortObject(vnp_Params);

    console.log('=== PARAMS BEFORE HASH ===');
    console.log(vnp_Params);

    // Tạo chuỗi hash data theo cách thủ công
    const sortedKeys = Object.keys(vnp_Params).sort();
    const signDataParts: string[] = [];
    
    for (const key of sortedKeys) {
      const value = vnp_Params[key];
      // Encode từng giá trị
      const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
      signDataParts.push(`${key}=${encodedValue}`);
    }
    
    const signData = signDataParts.join('&');

    console.log('=== SIGN DATA ===');
    console.log(signData);

    // Create secure hash
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== SECURE HASH ===');
    console.log(signed);

    vnp_Params['vnp_SecureHash'] = signed;

    // Build final URL - encode lại toàn bộ
    const urlParts: string[] = [];
    for (const key in vnp_Params) {
      const value = vnp_Params[key];
      const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
      urlParts.push(`${key}=${encodedValue}`);
    }
    
    const paymentUrl = vnpUrl + '?' + urlParts.join('&');

    console.log('=== PAYMENT URL ===');
    console.log(paymentUrl);

    return paymentUrl;
  }

  private sortObject(obj: any) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }

  // Verify callback từ VNPay
  verifyReturnUrl(query: any) {
    const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
    const vnp_SecureHash = query['vnp_SecureHash'];

    // Loại bỏ các tham số không cần thiết
    const vnp_Params = { ...query };
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    const sortedParams = this.sortObject(vnp_Params);

    console.log('=== VERIFY PARAMS ===');
    console.log(sortedParams);

    // Tạo sign data
    const sortedKeys = Object.keys(sortedParams).sort();
    const signDataParts: string[] = [];
    
    for (const key of sortedKeys) {
      const value = sortedParams[key];
      const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
      signDataParts.push(`${key}=${encodedValue}`);
    }
    
    const signData = signDataParts.join('&');

    console.log('=== VERIFY SIGN DATA ===');
    console.log(signData);

    // Tạo hash
    if(!secretKey){
      throw new BadRequestException("Không tìm thấy secretKey")
    }
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VERIFY HASH ===');
    console.log('Calculated:', signed);
    console.log('Received:', vnp_SecureHash);

    const isValid = signed === vnp_SecureHash;

    return {
      isValid,
      responseCode: query['vnp_ResponseCode'],
      orderId: query['vnp_TxnRef'],
      amount: query['vnp_Amount'] / 100,
      transactionNo: query['vnp_TransactionNo'],
      bankCode: query['vnp_BankCode'],
      payDate: query['vnp_PayDate'],
    };
  }
}