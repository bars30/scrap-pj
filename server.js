const express = require('express');
const { getAutocompleteSuggestions, scrapeSERP } = require('./scraper');
const app = express();
app.use(express.json());
const axios = require('axios'); // Դա պետք է լինի ամենավերին մասում
const { chromium } = require('playwright'); // Ավելացրու սա
const googleTrends = require('google-trends-api');

async function getSearchVolumeFromGoogleTrends(keyword) {
 try {
   const results = await googleTrends.interestOverTime({
     keyword: keyword,
     startTime: new Date('2023-01-01'),
     endTime: new Date('2023-12-31'),
   });

   const data = JSON.parse(results);
   const timelineData = data.default.timelineData;

   if (!timelineData || timelineData.length === 0) {
     console.log('No data found for keyword:', keyword);
     return null;
   }

   const avgSearchVolume = timelineData.reduce((sum, point) => sum + point.value[0], 0) / timelineData.length;
   return Math.round(avgSearchVolume);

 } catch (error) {
   console.error('Error fetching data from Google Trends API:', error);
   return null;
 }
}

async function scrapeGoogleTrends2025(keyword) {
  console.log(`Scraping Google Trends for keyword: ${keyword}`); // Լոգին տալիս ենք որ իմանանք, թե երբ է սկսել քաշելը
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const trendsUrl = `https://trends.google.com/trends/explore?date=2023-01-01%202023-12-31...`; // Ուղղել ամսաթիվը

  console.log(`Navigating to: ${trendsUrl}`);  // Լոգեր՝ URL-ն տպելու համար
  await page.goto(trendsUrl, { waitUntil: 'networkidle0' });

  // await page.waitForTimeout(3000);

  // Քաշում ենք տվյալները
  const data = await page.evaluate(() => {
    console.log('Evaluating page content'); // Ավելացնել լոգեր, երբ փորձում ես քաշել տվյալները
    const scripts = Array.from(document.querySelectorAll('script'));
    console.log(`Found ${scripts.length} script tags.`); // Լոգ՝ քանի script tag կա
    const chartDataScript = scripts.find(s => s.textContent.includes('timelineData'));
    
    if (!chartDataScript) {
      console.log('timelineData not found'); // Լոգ՝ երբ timelineData չի գտնվի
      return null;
    }

    const match = chartDataScript.textContent.match(/"timelineData":(\[.*?\])\s*,\s*"averages"/s);
    if (!match) {
      console.log('No matching data found in the script'); // Լոգ՝ եթե տվյալները չեն գտնվել
      return null;
    }

    const timelineData = JSON.parse(match[1]);
    console.log(`Found timeline data: ${JSON.stringify(timelineData)}`); // Լոգ՝ ցույց տալով գտնված տվյալները
    return timelineData;
  });

  await browser.close();
  console.log('Browser closed');
  return data;
}




async function calculateKeywordDifficulty(keyword) {
 // For now, just returning a dummy difficulty value
 return Math.floor(Math.random() * 100); // This is just a placeholder
}

// POST task
app.post('/api/v1/serp/task_post', async (req, res) => {
 const { keyword, language_code = 'en', location_code = 'us' } = req.body;

 console.log(`Received request to fetch data for keyword: ${keyword}, language: ${language_code}, location: ${location_code}`);

 try {
   const autocomplete = await getAutocompleteSuggestions(keyword);
   const serpResults = await scrapeSERP(keyword);

   console.log('Autocomplete results:', autocomplete);  // Լոգ՝ արդյունքների մասին
   console.log('SERP results:', serpResults);  // Լոգ՝ SERP արդյունքների մասին

   const keywordMetrics = await getAllKeywordMetrics(autocomplete);

   res.json({
     status: 'finished',
     result: { autocomplete, serpResults, keywordMetrics }
   });
 } catch (err) {
   console.error('Error:', err.message);  // Լոգ՝ երբ սխալ է տեղի ունենում
   res.status(500).json({ status: 'error', error: err.message });
 }
});


async function getAllKeywordMetrics(keywords) {
 console.log('Fetching keyword metrics for keywords:', keywords);  // Լոգ՝ որոնք կեյվորթները պետք է մշակվեն
 const metrics = [];

 for (let keyword of keywords) {
   console.log(`Fetching metrics for keyword: ${keyword}`);  // Լոգ՝ երբ յուրաքանչյուր կեյվորթը մշակվում է
   const searchVolume = await getSearchVolumeFromGoogleTrends(keyword);
   const keywordDifficulty = await calculateKeywordDifficulty(keyword);

   metrics.push({
     keyword,
     searchVolume: searchVolume ? searchVolume : "No data available",
     keywordDifficulty
   });
 }

 console.log('Keyword metrics fetched:', metrics);  // Լոգ՝ երբ ամեն ինչ ավարտվել է
 return metrics;
}


async function getKeywordMetrics(keyword) {
 const searchVolume = await getSearchVolumeFromGoogleTrends(keyword);
 const keywordDifficulty = await calculateKeywordDifficulty(keyword);

 // Տվյալները վերադարձնում ենք որպես արդյունք
 return {
   searchVolume: searchVolume ? searchVolume : "Data not found",
   keywordDifficulty: keywordDifficulty
 };
}

app.listen(3000, () => console.log('API running on http://localhost:3000'));
