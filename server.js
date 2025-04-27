const express = require('express');
const { getAutocompleteSuggestions, scrapeSERP } = require('./scraper');
const app = express();
app.use(express.json());
const axios = require('axios'); // Դա պետք է լինի ամենավերին մասում

const googleTrends = require('google-trends-api');

async function getSearchVolumeFromGoogleTrends(keyword) {
  try {
    const data = await googleTrends.interestOverTime({ keyword: keyword, geo: 'US' });
    const parsedData = JSON.parse(data);
    const searchVolume = parsedData.default.timelineData;
    return searchVolume;
  } catch (error) {
    console.error('Error fetching Google Trends data:', error);
    return null;
  }
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
