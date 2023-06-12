import { getProducts } from "../api/e-commerce";
import { EcommerceProduct } from "../models/e-commerce";

export interface ScraperInitProps {
  priceStep?: number;
}

/**
 * Class that scraps products from e-commerce API.
 * Scraper offers ascending and descending scrapping.
 * The scraper attempt to minimize dependency on API limits as much as possible
 * but the descending method is still dependent on the API price range
 */
class Scraper {
  private scrappedProducts: EcommerceProduct[] = [];

  // price step is only valid for ascending parse
  private readonly defaultCurrentPriceStep = 200;
  private readonly defaultCurrentMinPrice = 0;
  private readonly defaultCurrentMaxPrice = 100000;

  // price step is only valid for ascending parse
  private currentPriceStep: number = this.defaultCurrentPriceStep;

  private currentMinPrice: number = this.defaultCurrentMinPrice;
  private ascCurrentMaxPrice: number = this.defaultCurrentMinPrice + this.defaultCurrentMaxPrice;
  private dscCurrentMaxPrice: number = this.defaultCurrentMaxPrice;

  private initialized: boolean = true;
  
  get getScrappedProducts(): EcommerceProduct[] {
    return this.scrappedProducts;
  }

  /**
   * Method initializes Scraper for scrapping.
   * If config is provided then it uses values that are provided otherwise it uses default values.
   * If initialization is not called before scrapping the scrapping methods will call it by themselves
   * @param config includes values that affect initializing Scraper properties
   * @returns reference to current intance of Scraper to make chain call possible
   */
  init(config?: ScraperInitProps): Scraper {
    const { priceStep = this.defaultCurrentPriceStep } = config ?? {};
  
    this.currentMinPrice = this.defaultCurrentMinPrice;
    this.dscCurrentMaxPrice = this.defaultCurrentMaxPrice;
    this.ascCurrentMaxPrice = this.defaultCurrentMinPrice + priceStep;
    this.currentPriceStep = priceStep;

    this.scrappedProducts = [];

    this.initialized = true;

    return this;
  }

  /**
   * Method recursively divides price range into halfs until all products from the price range are fetched.
   * @param minPrice is minimal price of the price range
   * @param maxPrice is maximal price of the price range
   * @returns all products from the price range
   * @throws error when price range is no able to divide anymore (that indicates that there are more products with the same price that APi allows to fetch at one request)
   */
  private async solveRecursivelyOverLimitInPriceRange(minPrice: number, maxPrice: number): Promise<EcommerceProduct[]> {
    const priceRange = maxPrice - minPrice;
    // the middle of the price range is rounded to the nearest hundredth place
    // because the Scraper assumes that the prices have maximum 2 decimal digits
    const halfMaxPrice = +(((priceRange) / 2) + minPrice).toFixed(3);

    // if middle of price range is same as minimal price range then the price range is not able to divide anymore
    // that indicates that there are more products in the price range then API allows to fetch at one request
    if (halfMaxPrice === minPrice) {
      throw new Error('It seems like there are more products with the same price than API is able to return in single response');
    }

    // the subtracting of 0.001 from halfMaxPrice is to avoid fetching products with the same price twice
    // if there was not the subtraction then the halfMaxPrice would be included in the bottom half and the upper half at the same time
    const bottomHalfProductsResponse = await getProducts({ minPrice, maxPrice: halfMaxPrice - 0.001 });
    const bottomHalfProducts =
      bottomHalfProductsResponse.count < bottomHalfProductsResponse.total
        ? (await this.solveRecursivelyOverLimitInPriceRange(minPrice, halfMaxPrice - 0.001))
        : bottomHalfProductsResponse.products;


    const upperHalfProductsResponse = await getProducts({ minPrice: halfMaxPrice, maxPrice });
    const upperHalfProducts =
      upperHalfProductsResponse.count < upperHalfProductsResponse.total
        ? (await this.solveRecursivelyOverLimitInPriceRange(halfMaxPrice, maxPrice))
        : upperHalfProductsResponse.products

    return [
      ...bottomHalfProducts,
      ...upperHalfProducts
    ]
  }

  /**
   * Method scraps products from e-commerce api.
   * Method scraps products via "ascending" method.
   * Method fetches products in defined price ranges (steps) and if any of those price ranges
   * can't fetch all products in the price range then the price range is recursively divided into halfs
   * until all products from the range are fetched.
   * This method doesn't need to know the highest price of the products
   * @returns reference to current intance of Scraper to make chain call possible
   */
  async scrapAscending(): Promise<Scraper> {
    if (!this.initialized) {
      this.init();
    }
    this.initialized = false;
    
    // total products in the e-commerce
    const { total } = await getProducts();

    // products are being fetched in batches (in price ranges - steps) until all products are fetched
    while(this.scrappedProducts.length < total) {
      const response = await getProducts({ minPrice: this.currentMinPrice, maxPrice: this.ascCurrentMaxPrice });

      // if are products are not fetched in the price range then the price range is recursively divided into half
      // until all products are fetched from the price range
      this.scrappedProducts = [
        ...this.scrappedProducts,
        ...(response.count < response.total
              ? (await this.solveRecursivelyOverLimitInPriceRange(this.currentMinPrice, this.ascCurrentMaxPrice))
              : response.products)
      ]

      this.currentMinPrice += this.currentPriceStep;
      this.ascCurrentMaxPrice += this.currentPriceStep;
    }

    return this;
  }

  /**
   * Method scraps products from e-commerce api.
   * Method scraps products via "descending" method.
   * Method tries to fetch all products (full range of price) and if its not possible due to API limits
   * then recursively divides the price range and tries again until all products are fetched
   * This method depends on the highest price of the products (if the price is not know this method won't work)
   * @returns reference to current intance of Scraper to make chain call possible
   */
  async scrapDescending(): Promise<Scraper> {
    if (!this.initialized) {
      this.init();
    }
    this.initialized = false;

    const response = await getProducts();

    // if all products from the API are fetched at one request then nothing else has to be done
    // else price range is recursively divided into half until all products are fetched
    this.scrappedProducts =
      response.count < response.total
         ? (await this.solveRecursivelyOverLimitInPriceRange(this.currentMinPrice, this.dscCurrentMaxPrice))
         : response.products;
  
    return this;
  }
}

export default Scraper;