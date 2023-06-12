import Scraper from './scraper';

async function scrapDescending() {
  const scrapper = new Scraper();
  return (await scrapper.init().scrapDescending()).getScrappedProducts;
}

async function scrapAscending() {
  const scrapper = new Scraper();
  return (await scrapper.init().scrapAscending()).getScrappedProducts;
}

scrapAscending().then(result => {
  const products = result;
})

scrapDescending().then(result => {
  const products = result;
})