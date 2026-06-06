const fs = require('fs');
const lines = fs.readFileSync('D:/WorkBuddy/vocab-learning-app/28天英语单词分类记忆法.md', 'utf8').split('\n');

const cnToNum = {
  '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
  '十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,
  '二十一':21,'二十二':22,'二十三':23,'二十四':24,'二十五':25,'二十六':26,'二十七':27,'二十八':28
};

function parseCnDay(s) {
  return cnToNum[s] || parseInt(s) || NaN;
}

const result = { title: "28天词汇分类速记", totalDays: 28, days: [] };
let currentDay = null, currentCategory = null;
let lastDayNum = 0;

for (const line of lines) {
  // Skip ## section headers (一、话题类, 二、短语类, etc.)
  if (line.match(/^##\s/)) continue;

  // Day header: ### 第X天：...
  const dayMatch = line.match(/^###\s+第([一二三四五六七八九十]+)天/);
  if (dayMatch) {
    if (currentDay) result.days.push(currentDay);
    const dayNum = parseCnDay(dayMatch[1]);
    if (isNaN(dayNum)) continue; // skip non-day ### headers (like appendix)
    currentDay = {
      day: dayNum,
      title: line.replace(/^###\s+/, '').trim(),
      categories: []
    };
    lastDayNum = dayNum;
    currentCategory = null;
    continue;
  }

  // Category header: #### ... (but skip numbered sections in appendix)
  const catMatch = line.match(/^####\s+(.+)/);
  if (catMatch && currentDay) {
    const name = catMatch[1].trim();
    currentCategory = { name, words: [] };
    currentDay.categories.push(currentCategory);
    continue;
  }

  // Also match ##### for sub-categories
  const subCatMatch = line.match(/^#####\s+(.+)/);
  if (subCatMatch && currentDay) {
    const name = subCatMatch[1].trim();
    currentCategory = { name, words: [] };
    currentDay.categories.push(currentCategory);
    continue;
  }

  // Auto-create category if words appear directly under day heading
  if (!currentCategory && currentDay) {
    currentCategory = { name: '词汇', words: [] };
    currentDay.categories.push(currentCategory);
  }

  if (!currentCategory) continue;

  // Word line: 1. word pos. meaning  or  1. word meaning
  const wordMatch = line.match(/^\d+\.\s+(.+)/);
  if (!wordMatch) continue;

  const content = wordMatch[1].trim();

  // Pre-process: unescape markdown periods
  let cleanContent = content.replace(/\\(\.)/g, '.');

  // Try: word pos. meaning
  const posMatch = cleanContent.match(/^(\S+(?:\s+\S+)?)\s+(n\.|adj\.|adv\.|v\.|vi\.|vt\.|prep\.|conj\.|pron\.|num\.|art\.|interj\.|aux\.|modal\s+v\.|n\.\s*&\s*v\.|v\.\s*&\s*n\.|adj\.\s*&\s*adv\.|adj\.\s*&\s*n\.|n\.\s*&\s*adj\.|n\.\s*&\s*adv\.|int\.|abbr\.)\s+(.+)/);
  if (posMatch) {
    const word = posMatch[1].replace(/[,;].*$/, '').trim();
    const pos = posMatch[2].trim();
    const def = posMatch[3].trim();
    currentCategory.words.push({ word, phonetic: '', pos, def, meaning: pos + ' ' + def });
    continue;
  }

  // Simpler: word pos (single word meaning follows)
  const pos2 = cleanContent.match(/^(\S+)\s+(n\.|adj\.|adv\.|v\.|vi\.|vt\.|prep\.|conj\.|pron\.|num\.|art\.|interj\.|aux\.|abbr\.)\s+(.+)/);
  if (pos2) {
    const word = pos2[1].replace(/[;,].*$/, '').trim();
    const pos = pos2[2].trim();
    const def = pos2[3].trim();
    currentCategory.words.push({ word, phonetic: '', pos, def, meaning: pos + ' ' + def });
    continue;
  }

  // Multi-word phrase: word meaning (no part of speech)
  const phraseMatch = cleanContent.match(/^(\S+(?:\s+\S+){0,5})\s{2,}(.+)/);
  if (phraseMatch) {
    const word = phraseMatch[1].trim();
    const def = phraseMatch[2].trim();
    currentCategory.words.push({ word, phonetic: '', pos: '', def, meaning: def });
    continue;
  }

  // Fallback: just take everything
  const fallback = cleanContent.match(/^(\S+(?:\s+\S+){0,5})\s+(.+)/);
  if (fallback) {
    const word = fallback[1].trim();
    const def = fallback[2].trim();
    currentCategory.words.push({ word, phonetic: '', pos: '', def, meaning: def });
  }
}

if (currentDay) result.days.push(currentDay);

// Filter out empty categories
result.days.forEach(d => {
  d.categories = d.categories.filter(c => c.words.length > 0);
});

// Filter out days with no words
result.days = result.days.filter(d => d.categories.length > 0);

// Assign sequential day numbers
result.days.forEach((d, i) => { d.day = i + 1; });
result.totalDays = result.days.length;

fs.writeFileSync('D:/WorkBuddy/vocab-learning-app/src/data/vocabulary.json', JSON.stringify(result, null, 2), 'utf8');

let totalWords = 0;
console.log(`Total days: ${result.days.length}`);
result.days.forEach(d => {
  const dc = d.categories.reduce((s,c) => s + c.words.length, 0);
  totalWords += dc;
  console.log(`Day ${d.day}: ${dc} words [${d.categories.map(c=>c.name+'('+c.words.length+')').join(', ')}]`);
});
console.log(`\nTotal words: ${totalWords}`);
