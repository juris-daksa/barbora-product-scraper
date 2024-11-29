import puppeteer from 'puppeteer-core';
import fs from 'fs';
import url from 'url';
import dotenv from 'dotenv';
import { resetSession } from './utils.js';

dotenv.config();

export async function scrapeProducts() {
  let browser;
  let page;
  const brdConfig = process.env.BRD_CONFIG;
  console.log(`\nBrightData config: \"${brdConfig}\"\n`);

  try {
    await resetSession(browser, page, brdConfig);

    await page.goto('https://barbora.lv/');

    const linksSelector = 'a.category-item--title';
    await page.waitForSelector(linksSelector);
    const categoryLinks = await page.evaluate(() => {
      const links = [];
      const elements = document.querySelectorAll('a.category-item--title');
      elements.forEach(element => {
        links.push({
          href: element.href,
          category: element.innerText.trim()
        });
      });

      return links;
    });

    console.log(`Found ${categoryLinks.length} categories`);
    categoryLinks.forEach(link => {
      console.log(`${link.category}:\"${link.href}\"`);
    });

    return;
    
    let allProducts = {};

    for (const { href, category } of categoryLinks) {
      const absoluteLink = url.resolve('https://barbora.lv', href);
      await resetSession(browser, page, brdConfig);
      await page.goto(absoluteLink);

      console.log(`\nExtracting from \"${absoluteLink}\"...`);

      let products = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const newProducts = await page.evaluate(() => {
          const items = [];
          const productElements = document.querySelectorAll('[id^="fti-product-card-category-page-"]');

          productElements.forEach(product => {
            const data = product.getAttribute('data-b-for-cart');
            if (data) {
              const productInfo = JSON.parse(data);
              const title = productInfo.title;
              const price = productInfo.price;
              const retailPrice = productInfo.retail_price;
              const discount = productInfo.promotion ? productInfo.promotion.percentage : null;
              const productUrl = productInfo.Url;
              const unitPrice = productInfo.comparative_unit_price;
              const unit = productInfo.comparative_unit;
              items.push({ title, price, retailPrice, discount, productUrl, unitPrice, unit });
            }
          });

          return items;
        });

        products = products.concat(newProducts);

        const nextPageLink = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('a'));
          const nextPageElement = elements.find(element => element.textContent.includes('»'));
          return nextPageElement ? nextPageElement.href : null;
        });

        if (nextPageLink) {
          const nextPageNumber = new URL(nextPageLink).searchParams.get('page');
          if (nextPageNumber && parseInt(nextPageNumber) > currentPage) {
            currentPage = parseInt(nextPageNumber);
            await Promise.all([
              page.waitForNavigation(),
              page.goto(nextPageLink)
            ]);
          } else {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }
      }

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
