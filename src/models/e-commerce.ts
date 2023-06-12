export interface EcommerceProduct {
  [key: string]: unknown;
}

export interface GetEcommerceProductsProps {
  minPrice?: number;
  maxPrice?: number;
}

export interface EcommerceProductsResponseData {
  total: number;
  count: number;
  products: EcommerceProduct[]; 
}