const express = require('express');
const { getAutocompleteSuggestions, scrapeSERP } = require('./scraper');
const app = express();
app.use(express.json());

// POST task
app.post('/api/v1/serp/task_post', async (req, res) => {
  const { keyword, language_code = 'en', location_code = 'us' } = req.body;

  try {
    // Scrape autocomplete and SERP results
    const autocomplete = await getAutocompleteSuggestions(keyword);
    const serpResults = await scrapeSERP(keyword);
    
    res.json({
      status: 'finished',
      result: { autocomplete, serpResults }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));
