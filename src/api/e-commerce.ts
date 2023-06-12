import axios, { AxiosResponse } from 'axios';
import { EcommerceProductsResponseData, GetEcommerceProductsProps } from '../models/e-commerce';

/**
 * Function fetches products from e-commerce API.
 * E-commerce API has limit of fetched products on one request (1000)
 * @param props are function props including price range (properties minPrice and maxPrice)
 * @returns fetched products
 * @throws error when no response or no data received
 */
export async function getProducts(props?: GetEcommerceProductsProps) {
  const { minPrice, maxPrice } = props ?? {};

  let response: AxiosResponse<EcommerceProductsResponseData>;
  try {
    response = await axios({
      method: 'GET',
      url: 'https://api.ecommerce.com/products',
      params: {
        minPrice,
        maxPrice
      }
    })
  } catch (err) {
    console.log(err);
    throw err;
  }

  if (!response?.data) {
    throw new Error('GET products response has no data!');
  }

  return response.data;
}