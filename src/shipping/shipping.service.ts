import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';


@Injectable()
export class ShippingService {
    private ghnUrl: string | undefined
    private token: string | undefined
    private shopId: string | undefined

    constructor(private httpService: HttpService, private configService: ConfigService){
        this.ghnUrl = this.configService.get<string>('GHN_API_URL')
        this.token = this.configService.get<string>('GHN_TOKEN')
        this.shopId = this.configService.get<string>('GHN_SHOP_ID')
    }

    //lay header
    private getHeaders(){
        return {
            'Content-Type': 'application/json',
            'Token': this.token,
            'ShopId': this.shopId
        }
    }

    //lay tinh/tp
    async getProvinces(){
        try {
            const res = await lastValueFrom(
                this.httpService.get(`${this.ghnUrl}/master-data/province`,{headers: this.getHeaders()})
            )
            return res.data.data
        } catch (error) {
            throw new HttpException(error.response?.data?.message || 'Lỗi GHN', error.response?.status || 500)
        }
    }
    //lay quan huyen
    async getDistricts(provinceId: number) {
        try {
          const response = await lastValueFrom(
            this.httpService.get(`${this.ghnUrl}/master-data/district`, {
              headers: this.getHeaders(),
              params: { province_id: provinceId },
            })
          );
          return response.data.data;
        } catch (error) {
          throw new HttpException(error.response?.data?.message || 'Lỗi GHN', error.response?.status || 500);
        }
      }
    
      //Lấy Phường/Xã
      async getWards(districtId: number) {
        try {
          const response = await lastValueFrom(
            this.httpService.get(`${this.ghnUrl}/master-data/ward`, {
              headers: this.getHeaders(),
              params: { district_id: districtId },
            })
          );
          return response.data.data;
        } catch (error) {
          throw new HttpException(error.response?.data?.message || 'Lỗi GHN', error.response?.status || 500);
        }
      }
      async getAvailableServices(toDistrictId: number) {
        try {
          const response = await lastValueFrom(
            this.httpService.post(
              `${this.ghnUrl}/v2/shipping-order/available-services`,
              {
                shop_id: Number(this.shopId),
                from_district: 1442, //code o ghn
                to_district: toDistrictId,
              },
              { headers: this.getHeaders() }
            )
          );
          return response.data.data;
        } catch (error) {
          
          console.error("GHN Services Error:", error.response?.data);
          throw new HttpException('Lỗi lấy dịch vụ GHN', 500);
        }
      }
    
      // Tính phí ship
      async calculateFee(data: any) {
        try {
          const payload = {
            service_id: data.service_id,
            to_district_id: data.to_district_id,
            to_ward_code: data.to_ward_code,
            height: 10,
            length: 30,
            width: 20,
            weight: 3000,
            insurance_value: 0,
            
          };
    
          const response = await lastValueFrom(
            this.httpService.post(`${this.ghnUrl}/v2/shipping-order/fee`, payload, {
              headers: this.getHeaders(),
            })
          );
          return response.data;
        } catch (error) {
            console.error("GHN Fee Error:", error.response?.data);
          throw new HttpException(error.response?.data?.message || 'Lỗi tính phí GHN', error.response?.status || 500);
        }
      }





}
