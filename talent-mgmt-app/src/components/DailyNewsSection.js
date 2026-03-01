import React, { useState, useEffect } from 'react';
import './DailyNewsSection.css';

const DailyNewsSection = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use relative path so CRA dev server proxy (package.json `proxy`) forwards to backend
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('ニュース取得に失敗しました');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        setNewsList(data);
        setNews(data[0]);
        setCurrentIndex(0);
      } else {
        throw new Error('ニュースが見つかりません');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message);
      // フォールバック：ダミーニュース
      const fallbackNews = [
        {
          id: 1,
          title: "日本経済新聞 人事異動速報",
          description: "最新の人事異動情報を日本経済新聞から配信しています。",
          date: "2026-03-01",
          source: "日本経済新聞 人事ニュース",
          category: "人事異動",
          url: "https://www.nikkei.com/news/jinji/"
        }
      ];
      setNewsList(fallbackNews);
      setNews(fallbackNews[0]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNextNews = () => {
    if (newsList.length > 0) {
      const nextIndex = (currentIndex + 1) % newsList.length;
      setCurrentIndex(nextIndex);
      setNews(newsList[nextIndex]);
    }
  };

  const handlePrevNews = () => {
    if (newsList.length > 0) {
      const prevIndex = (currentIndex - 1 + newsList.length) % newsList.length;
      setCurrentIndex(prevIndex);
      setNews(newsList[prevIndex]);
    }
  };

  const handleOpenSource = () => {
    if (news?.url) {
      window.open(news.url, '_blank');
    }
  };

  return (
    <div className="daily-news-container">
      <div className="news-header">
        <h2 className="news-title">📰 Daily 人事異動ニュース</h2>
        <button 
          className="refresh-btn" 
          onClick={fetchNews} 
          title="ニュースを更新"
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          📡 日本経済新聞からニュースを取得中...
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {news && !loading && (
        <>
          <div className="news-card">
            <div className="news-meta">
              <span className="news-date">{news.date}</span>
              <span className="news-category">{news.category}</span>
            </div>

            <h3 className="news-item-title">{news.title}</h3>

            <p className="news-description">{news.description}</p>

            <div className="news-footer">
              <span className="news-source">出典: {news.source}</span>
              <button 
                className="read-more-btn"
                onClick={handleOpenSource}
                title="ニュース元を開く"
              >
                →
              </button>
            </div>
          </div>

          {newsList.length > 1 && (
            <div className="news-navigation">
              <button 
                className="nav-btn prev-btn"
                onClick={handlePrevNews}
                title="前のニュース"
              >
                ← 前へ
              </button>
              <span className="news-counter">
                {currentIndex + 1} / {newsList.length}
              </span>
              <button 
                className="nav-btn next-btn"
                onClick={handleNextNews}
                title="次のニュース"
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}

      <div className="news-hint">
        💡 リフレッシュボタンで最新のニュースを取得できます
      </div>
    </div>
  );
};

export default DailyNewsSection;
