const article = document.querySelector('#content');

console.log('article', article);

if (article) { 
  // 总字数 / 阅读效率(每分钟阅读字数)
  const text = article.textContent;
  const wordMatchRegExp = /[^\s]+/g;
  const words = text.matchAll(wordMatchRegExp);

  const wordCount = [...words].length;

  // 阅读效率
  const readingEfficiency = 50; // 每分钟阅读字数
  // 阅读时间
  const readingTime = Math.round(wordCount / readingEfficiency);

  const badge = document.createElement('div');
  badge.classList.add("section-content");
  badge.textContent = `阅读时间：${readingTime}分钟`;

  const header = article.querySelector(".reference-layout__header");

  header.appendChild(badge);
}