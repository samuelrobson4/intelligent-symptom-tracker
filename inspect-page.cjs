const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'landing-page-current.png', fullPage: true });

  // Get computed styles
  const styles = await page.evaluate(() => {
    const title = document.querySelector('h1');
    const subtitle = document.querySelector('p');
    const logo = document.querySelector('img');

    return {
      title: title ? {
        fontSize: window.getComputedStyle(title).fontSize,
        color: window.getComputedStyle(title).color,
        textAlign: window.getComputedStyle(title).textAlign,
      } : null,
      subtitle: subtitle ? {
        fontSize: window.getComputedStyle(subtitle).fontSize,
        color: window.getComputedStyle(subtitle).color,
        maxWidth: window.getComputedStyle(subtitle).maxWidth,
      } : null,
      logo: logo ? {
        width: window.getComputedStyle(logo).width,
        height: window.getComputedStyle(logo).height,
        src: logo.src,
      } : null,
    };
  });

  console.log('Current styles:', JSON.stringify(styles, null, 2));

  await browser.close();
})();
