import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { get } from 'axios';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('provinces')
  getProvinces(){
    return this.shippingService.getProvinces()
  }

  @Get('districts')
  getDistricts(@Query('province_id') provinceId: number){
    return this.shippingService.getDistricts(provinceId)
  }

  @Get('wards')
  getWards(@Query('district_id') districtId: number){
    return this.shippingService.getWards(districtId)
  }

  @Post('fee')
  calculateFee(@Body() body: any){
    return this.shippingService.calculateFee(body)
  }
  
  @Get('services')
  getServices(@Query('to_district') toDistrict: number) {
    return this.shippingService.getAvailableServices(Number(toDistrict));
  }

}
