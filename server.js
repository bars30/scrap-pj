const express = require('express');
const { getAutocompleteSuggestions, scrapeSERP } = require('./scraper');
const app = express();
app.use(express.json());
const axios = require('axios'); // Դա պետք է լինի ամենավերին մասում
const { chromium } = require('playwright'); // Ավելացրու սա
const googleTrends = require('google-trends-api');

async function getSearchVolumeFromGoogleTrends(keyword) {
 try {
   const searchVolume = await scrapeGoogleTrends2025(keyword);
   return searchVolume;
 } catch (error) {
   console.error('Error scraping Google Trends 2025 data:', error);
   return null;
 }
}
async function scrapeGoogleTrends2025(keyword) {
 const browser = await chromium.launch({ headless: true });
 const page = await browser.newPage();

 const trendsUrl = `https://trends.google.com/trends/explore?date=2025-01-01%202025-12-31&geo=US&q=${encodeURIComponent(keyword)}`;
 await page.goto(trendsUrl, { waitUntil: 'domcontentloaded' });

 // Փոքր սպասում, որ scripts լցվեն
 await page.waitForTimeout(3000);

 // Փորձում ենք script-ներից քաշել timelineData
 const data = await page.evaluate(() => {
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



async function calculateKeywordDifficulty(keyword) {
 // For now, just returning a dummy difficulty value
 return Math.floor(Math.random() * 100); // This is just a placeholder
}

// POST task
app.post('/api/v1/serp/task_post', async (req, res) => {
 const { keyword, language_code = 'en', location_code = 'us' } = req.body;

 try {
   const autocomplete = await getAutocompleteSuggestions(keyword);
   const serpResults = await scrapeSERP(keyword);
   const keywordMetrics = await getKeywordMetrics(keyword);

   res.json({
     status: 'finished',
     result: { autocomplete, serpResults, keywordMetrics }
   });
 } catch (err) {
   res.status(500).json({ status: 'error', error: err.message });
 }
});

async function getKeywordMetrics(keyword) {
 // Google Trends, այլ տվյալների աղբյուրներից ձեռք բերեք տվյալներ
 const searchVolume = await getSearchVolumeFromGoogleTrends(keyword);
 const keywordDifficulty = await calculateKeywordDifficulty(keyword);

 return { searchVolume, keywordDifficulty };
}


app.listen(3000, () => console.log('API running on http://localhost:3000'));
