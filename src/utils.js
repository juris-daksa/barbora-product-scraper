import puppeteer from 'puppeteer-core';

export async function resetSession(brdConfig) {
    let browser = await puppeteer.connect({
        browserWSEndpoint: brdConfig
    });

    let page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    return { browser, page };
}

export async function extractCategoryLinks(page) {
  const linksSelector = 'a.category-item--title';
  await page.waitForSelector(linksSelector);
  return await page.evaluate(() => {
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
}

export async function extractProductsFromCategory(page) {
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

  return products;
}
