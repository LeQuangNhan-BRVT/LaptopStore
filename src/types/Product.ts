// 1. Định nghĩa Interface cho ảnh (ProductImage)
export interface IProductImage {
  image_id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
}
export interface ITag {
  tag_id: number;
  name: string;
  slug: string;
  description: string;
  products_tag: IProduct[];
}
// 2. Định nghĩa Interface cho thông số kỹ thuật (ProductSpecification)
// (Chúng ta sẽ cần cái này cho phần sau)
export interface IProductSpecification {
  spec_id: number;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  gpu: string | null;
  screen: string | null;
  os: string | null;
  pin: string | null;
  weight: number | null;
  
}

// 3. Cập nhật Interface chính (IProduct)
export interface IProduct {
  product_id: number;
  sku: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  primary_image: string | null; // Ảnh đại diện (xử lý ở backend)
  quantity: number;
  description: string | null;
  is_active: boolean;
  brand_id: number;
  category_id: number;
  product_tag: ITag;
  // --- CÁC QUAN HỆ (QUAN TRỌNG) ---
  images?: IProductImage[];             // Mảng các đối tượng ảnh
  specification?: IProductSpecification; // Đối tượng thông số kỹ thuật
  brand?: { name: string };
  category?: { name: string };
}