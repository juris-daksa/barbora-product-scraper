import puppeteer from 'puppeteer-core';
import fs from 'fs';
import url from 'url';
import dotenv from 'dotenv';
import { resetSession, extractCategoryLinks, extractProductsFromCategory } from './utils.js';

dotenv.config();

export async function scrapeProducts() {
  let browser;
  let page;
  const brdConfig = process.env.BRD_CONFIG;
  console.log(`\nBrightData config: \"${brdConfig}\"\n`);

  try {
    ({browser, page} = await resetSession( brdConfig));

    await page.goto('https://barbora.lv/');
    const categoryLinks = await extractCategoryLinks(page);

    console.log(`Found ${categoryLinks.length} categories`);
    categoryLinks.forEach(link => {
      console.log(`${link.category}:\"${link.href}\"`);
    });

    let allProducts = {};

    for (const { href, category } of categoryLinks) {
      const absoluteLink = url.resolve('https://barbora.lv', href);
      ({page, browser} = await resetSession(brdConfig));
      await page.goto(absoluteLink);

      console.log(`\nExtracting from \"${absoluteLink}\"...`);
      const products = await extractProductsFromCategory(page);
      console.log(`Extracted ${products.length} products from \'${category}\'`);
      allProducts[category] = products;
    }

    const dateTime = new Date();
    const output = {
      dateTime,
      categories: allProducts
    };

    const fileName = `barbora-products-${dateTime.toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(output, null, 2));

    console.log(`Data stored to \'${fileName}\'`);

    return allProducts;
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await browser?.close();
  }
}
