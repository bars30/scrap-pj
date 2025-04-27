const axios = require('axios');
const { chromium } = require('playwright');

async function scrapeGoogleTrends2025(keyword) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Գնում ենք Trends էջը 2025 տարվա համար
  const trendsUrl = `https://trends.google.com/trends/explore?date=2025-01-01%202025-12-31&geo=US&q=${encodeURIComponent(keyword)}`;
  await page.goto(trendsUrl, { waitUntil: 'domcontentloaded' });

  // Սպասում ենք, որ գրաֆիկը լցվի
  await page.waitForSelector('g-highcharts-chart');

  // Վերցնում ենք գրաֆիկի տվյալները
  const data = await page.evaluate(() => {
    const chart = document.querySelector('g-highcharts-chart');
    if (!chart) return null;
    
    const scripts = Array.from(document.querySelectorAll('script'));
    const chartDataScript = scripts.find(s => s.textContent.includes('timelineData'));
    if (!chartDataScript) return null;

    const match = chartDataScript.textContent.match(/"timelineData":(\[.*?\])\s*,\s*"averages"/s);
    if (!match) return null;

    const timelineData = JSON.parse(match[1]);
    return timelineData;
  });

  await browser.close();
  return data;
}


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
   return Array.from(document.querySelectorAll('div#bres div.BVG0Nb')).map(el => el.innerText);
 });

 await browser.close();
 return results;
}

module.exports = { getAutocompleteSuggestions, scrapeSERP };
