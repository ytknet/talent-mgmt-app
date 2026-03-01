const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// ニューススクレイピング処理
async function fetchNews() {
  const response = await axios.get('https://www.nikkei.com/news/jinji/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const news = [];

  $('a[href*="/article/"]').each((index, element) => {
    if (news.length >= 5) return; // 最新5件取得

    const title = $(element).text().trim();
    const url = $(element).attr('href');
    if (!title.includes('人事')) return;

    const dateElement = $(element).parent().next().text().trim();

    if (title && url) {
      news.push({
        id: index,
        title,
        url,
        date: dateElement || '',
        source: '日本経済新聞',
        category: '人事異動',
        description: `${title}についての人事異動情報が日本経済新聞で報道されました。`
      });
    }
  });

  return news;
}

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const news = await fetchNews();
    if (news.length === 0) {
      return res.status(204).send();
    }
    res.json(news);
  } catch (err) {
    console.error('news route error', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;