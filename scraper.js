const axios = require('axios');
const { chromium } = require('playwright');


async function getAutocompleteSuggestions(keyword) {
  const response = await axios.get('https://suggestqueries.google.com/complete/search', {
    params: {
      client: 'firefox',
      q: keyword
    }
  });
  return response.data[1];
}

async function scrapeSERP(keyword) {
 const browser = await chromium.launch();
 const page = await browser.newPage();
 await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded' });

 const results = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.tF2Cxc')).map(el => el.innerText); // Փոփոխեք ընտրիչը, եթե անհրաժեշտ է
});

 await browser.close();
 return results;
}

module.exports = { getAutocompleteSuggestions, scrapeSERP };
