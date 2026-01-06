import apiClient from './apiClient'

export const ghnService = {
  getProvinces() {
    return apiClient.get('/shipping/provinces').then((res) => {
      console.log('GHN Provinces Response:', res.data)

      if (Array.isArray(res.data)) {
        return res.data
      }
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data
      }
      return []
    })
  },

  getDistricts(provinceId: number) {
    return apiClient
      .get('/shipping/districts', {
        params: { province_id: provinceId },
      })
      .then((res) => {
        
        if (Array.isArray(res.data)) return res.data
        if (res.data && Array.isArray(res.data.data)) return res.data.data
        return []
      })
  },

  getWards(districtId: number) {
    return apiClient
      .get('/shipping/wards', {
        params: { district_id: districtId },
      })
      .then((res) => {
        
        if (Array.isArray(res.data)) return res.data
        if (res.data && Array.isArray(res.data.data)) return res.data.data
        return []
      })
  },
  async getAvailableServices(toDistrictId: number) {
    return apiClient.get('/shipping/services', {
      params: { 
        to_district: toDistrictId,
        shop_id: import.meta.env.VITE_GHN_SHOP_ID // Gửi thêm shop_id nếu backend cần
      }
    }).then(res => {
        // Backend có thể trả về mảng trực tiếp hoặc bọc trong data
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
    });
  },

  async calculateFee(toDistrictId: number, toWardCode: string) {
    const services = await this.getAvailableServices(toDistrictId)
    if(!services || services.length === 0){
        throw new Error("Không tìm thấy gói vận chuyển cho khu vực này.")
    }
    const serviceId = services[0].service_id
    
    
    return apiClient
      .post('/shipping/fee', {
        service_id: serviceId, 
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      height: 10, weight: 2000, length: 30, width: 20, 
      insurance_value: 0
      })
      .then((res) => {if(res.data && res.data.data){
        return res.data.data
      }return res.data})
  },
}
