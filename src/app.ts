import Scraper from './scraper';

async function scrapDescending() {
  const scrapper = new Scraper();
  return (await scrapper.init().scrapDescending()).getScrapedProducts;
}

async function scrapAscending() {
  const scrapper = new Scraper();
  return (await scrapper.init().scrapAscending()).getScrapedProducts;
}

scrapAscending().then(result => {
  const products = result;
})

scrapDescending().then(result => {
  const products = result;
})