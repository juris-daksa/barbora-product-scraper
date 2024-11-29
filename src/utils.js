import puppeteer from 'puppeteer-core';

export async function resetSession(browser, page, brdConfig) {
  if (browser) {
    await browser.close();
  }

  browser = await puppeteer.connect({
    browserWSEndpoint: brdConfig
  });

  page = await browser.newPage();
  page.setDefaultNavigationTimeout(2 * 60 * 1000);
}
