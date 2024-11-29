import { scrapeProducts } from './scraper.js';

(async () => {
  try {
    const products = await scrapeProducts();
    console.log('Scraped products:', products);
  } catch (error) {
    console.error('Error scraping products:', error);
  }
})();
