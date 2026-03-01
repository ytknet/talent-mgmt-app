// 人事異動ニュースのダミーデータ
export const newsData = [
  {
    id: 1,
    title: "メルカリ、新CEO任命を発表 〜経営体制の強化〜",
    description: "メルカリは本日、新しいチーフエグゼクティブオフィサー（CEO）の任命を発表しました。新CEOは、過去10年間の経営経験を活かし、更なるグローバル展開を目指します。",
    date: "2026-03-01",
    source: "メルカリニュースリリース",
    category: "経営幹部"
  },
  {
    id: 2,
    title: "テックリーダーから経営へ 〜CTO交代の背景〜",
    description: "メルカリのCTO交代に関する背景について、自社の成長段階に応じた経営戦略の転換が主な要因であると発表されました。",
    date: "2026-02-28",
    source: "人事ニュース速報",
    category: "技術部門"
  },
  {
    id: 3,
    title: "人事部に新たな人材開発責任者が着任",
    description: "人材育成とキャリア開発を強化するため、新たに人材開発責任者が任命されました。グローバル企業としての人材戦略を推進します。",
    date: "2026-02-27",
    source: "HR通信",
    category: "人事"
  }
];

// ランダムに1件取得する関数
export const getRandomNews = () => {
  const randomIndex = Math.floor(Math.random() * newsData.length);
  return newsData[randomIndex];
};
