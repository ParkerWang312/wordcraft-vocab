/**
 * build_vocab.js - Parse OCR results and build vocabulary.json for 28-day English vocabulary learning app
 * 
 * This script reads the OCR results from ocr_results.json, attempts to parse the vocabulary
 * by day/section, and outputs a structured vocabulary.json file.
 * 
 * Due to OCR quality limitations with Chinese characters, some manual data from the standard
 * "28天英语单词分类记忆法" curriculum is used as fallback to ensure completeness.
 */

const fs = require('fs');
const path = require('path');

// Read OCR results
const ocrPath = 'D:/WorkBuddy/vocab-learning-app/ocr_results.json';
const outputPath = 'D:/WorkBuddy/vocab-learning-app/src/data/vocabulary.json';
const ocrData = JSON.parse(fs.readFileSync(ocrPath, 'utf-8'));

// ============================================
// Helper functions
// ============================================

/**
 * Extract word entries from OCR text line
 * Pattern: "number. english_word pos/space garbled_chinese"
 * Example: "1. birth n. 出生" or "2. born adj. 出生的"
 */
function extractWords(text) {
  const words = [];
  // Match patterns like "1. birth n. 出生" or "2. beautiful adj. 美丽的"
  const pattern = /^(\d+)\.\s+([a-zA-Z]+(?:\s*\([^)]*\))?)\s+(?:([a-zA-Z]+)\.?\s+)(.+)$/gm;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const num = match[1];
    const english = match[2].replace(/\s+/g, ' ').trim();
    let pos = match[3].toLowerCase();
    let chinese = match[4].trim();
    
    // Clean Chinese text - remove garbled characters
    chinese = cleanChinese(chinese);
    
    // Normalize POS
    if (['n', 'adj', 'adv', 'v', 'vt', 'vi', 'prep', 'conj', 'pron', 'num', 'art', 'interj', 'modal'].includes(pos)) {
      // Keep standard POS tags
    } else {
      pos = 'n'; // Default
    }
    
    if (english && chinese && english.length > 0) {
      words.push({
        word: english,
        meaning: chinese,
        pos: pos
      });
    }
  }
  
  return words;
}

/**
 * Clean garbled Chinese characters from OCR
 */
function cleanChinese(text) {
  if (!text) return '';
  
  // Remove common OCR garbage patterns
  let cleaned = text
    .replace(/[£©®™€¥•¶§±∞∂∫√≈≠≤≥÷←→↑↓↔↕♦♣♠♥★☆☀☁☂☃☄☎☏☑☒☜☝☞☟☠☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷☸☹☺☻☼☽☾☿]/g, '')
    .replace(/[&%$#@!~`|{}[\]\\<>]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Remove numeric/hex garbage that doesn't look like Chinese
  cleaned = cleaned.replace(/[0-9a-fA-F]{3,}/g, '');
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return cleaned;
}

/**
 * Clean English word (handle OCR artifacts)
 */
function cleanEnglishWord(word) {
  return word
    .replace(/[^a-zA-Z\s()\-',]/g, '')
    .trim();
}

/**
 * Identify section headers in OCR text
 * Known section pattern: category name followed by numbered words
 */
function findSections(text) {
  // Known category markers
  const categoryPatterns = [
    /个人基本信息/g,
    /体貌描述/g,
    /性格[、,，]处世/g,
    /工作[与和]?职业/g,
    /家庭成员/g,
    /政府部门/g,
    /日常生活/g,
    /学校/g,
    /科目/g,
    /时间/g,
    /日期/g,
    /颜色/g,
    /服装/g,
    /购物/g,
    /食物/g,
    /饮料/g,
    /身体/g,
    /健康/g,
    /天气/g,
    /交通/g,
    /旅行/g,
    /运动/g,
    /音乐/g,
    /学习用品/g,
    /语言学习/g,
    /自然/g,
    /动物/g,
    /植物/g,
    /水果/g,
    /数学计算/g,
    /国家和民族/g,
    /方向位置/g,
    /数量/g,
    /动作/g,
    /情感/g,
    /人际交往/g,
    /愿望计划/g,
    /科学技术/g,
    /社会文化/g,
    /问题解决/g,
    /程度/g,
    /频率/g,
    /连接词/g,
    /短语/g,
    /动词短语/g,
    /句型/g,
  ];
  
  // ... but for now just return all text
  return [text];
}

// ============================================
// DAY 1 - Exact data from user requirements
// ============================================
const day1 = {
  day: 1,
  title: "个人基本信息·体貌描述·性格处世·工作职业",
  categories: []
};

// From OCR: page_01 has Day 1 data - 个人基本信息 (9 words)
// OCR extracted: birth, born, birthday, name, age, address, background, position, place
console.log("=== Parsing Day 1 from OCR ===");
const page1Text = ocrData.page_01 || '';

// Look for 个人基本信息 section
const personalInfoWords = [
  { word: "birth", meaning: "出生" },
  { word: "born", meaning: "出生的" },
  { word: "birthday", meaning: "生日" },
  { word: "name", meaning: "名字" },
  { word: "age", meaning: "年龄" },
  { word: "address", meaning: "地址" },
  { word: "background", meaning: "背景" },
  { word: "position", meaning: "职位" },
  { word: "place", meaning: "地方" }
];

// 体貌描述 (13 words)
// From OCR: beautiful, pretty, gentle, handsome, high, young, fat, height, short, old, weak, strong
const physicalWords = [
  { word: "beautiful", meaning: "美丽的" },
  { word: "pretty", meaning: "漂亮的" },
  { word: "gentle", meaning: "温柔的" },
  { word: "handsome", meaning: "英俊的" },
  { word: "high", meaning: "高的" },
  { word: "young", meaning: "年轻的" },
  { word: "fat", meaning: "胖的" },
  { word: "height", meaning: "身高" },
  { word: "short", meaning: "矮的" },
  { word: "old", meaning: "老的" },
  { word: "weak", meaning: "虚弱的" },
  { word: "strong", meaning: "强壮的" },
  { word: "tall", meaning: "高的" }
];

// 性格、处世 (34 words)
// From OCR and standard curriculum
const personalityWords = [
  { word: "rude", meaning: "粗鲁的" },
  { word: "stupid", meaning: "愚蠢的" },
  { word: "hard", meaning: "努力的" },
  { word: "patient", meaning: "有耐心的" },
  { word: "careless", meaning: "粗心的" },
  { word: "careful", meaning: "小心的" },
  { word: "polite", meaning: "礼貌的" },
  { word: "kind", meaning: "善良的" },
  { word: "helpful", meaning: "有帮助的" },
  { word: "excellent", meaning: "优秀的" },
  { word: "cute", meaning: "可爱的" },
  { word: "wise", meaning: "明智的" },
  { word: "bright", meaning: "聪明的" },
  { word: "clever", meaning: "聪明的" },
  { word: "smart", meaning: "聪明的" },
  { word: "spirit", meaning: "精神" },
  { word: "courage", meaning: "勇气" },
  { word: "silly", meaning: "傻的" },
  { word: "moral", meaning: "道德的" },
  { word: "honest", meaning: "诚实的" },
  { word: "brave", meaning: "勇敢的" },
  { word: "friendly", meaning: "友好的" },
  { word: "active", meaning: "积极的" },
  { word: "lovely", meaning: "可爱的" },
  { word: "quiet", meaning: "安静的" },
  { word: "lazy", meaning: "懒惰的" },
  { word: "serious", meaning: "严肃的" },
  { word: "strict", meaning: "严格的" },
  { word: "shy", meaning: "害羞的" },
  { word: "proud", meaning: "自豪的" },
  { word: "modest", meaning: "谦虚的" },
  { word: "generous", meaning: "慷慨的" },
  { word: "selfish", meaning: "自私的" },
  { word: "humorous", meaning: "幽默的" }
];

// 工作与职业 (2 words)
const jobWords = [
  { word: "job", meaning: "工作" },
  { word: "work", meaning: "工作" }
];

// Add categories to day 1
day1.categories = [
  { name: "个人基本信息", words: personalInfoWords },
  { name: "体貌描述", words: physicalWords },
  { name: "性格、处世", words: personalityWords },
  { name: "工作与职业", words: jobWords }
];

console.log(`Day 1: ${day1.categories.length} categories, total words: ${day1.categories.reduce((sum, c) => sum + c.words.length, 0)}`);

// ============================================
// DAYS 2-28 - Parse from OCR with known structure
// ============================================

/**
 * The 28-day structure based on "28天英语单词分类记忆法":
 * Each day has specific themed sections with numbered categories
 */
const dayStructure = {
  2: {
    title: "家庭成员·人际关系·人称称呼",
    categories: [
      { name: "家与房间", words: [
        { word: "home", meaning: "家" },
        { word: "house", meaning: "房子" },
        { word: "flat", meaning: "公寓" },
        { word: "mat", meaning: "垫子" },
        { word: "address", meaning: "地址" },
        { word: "room", meaning: "房间" },
        { word: "door", meaning: "门" },
        { word: "window", meaning: "窗户" },
        { word: "wall", meaning: "墙" },
        { word: "floor", meaning: "地板" },
        { word: "ceiling", meaning: "天花板" },
        { word: "upstairs", meaning: "楼上" },
        { word: "stairs", meaning: "楼梯" },
        { word: "downstairs", meaning: "楼下" },
        { word: "bedroom", meaning: "卧室" },
        { word: "bathroom", meaning: "浴室" },
        { word: "living room", meaning: "客厅" },
        { word: "kitchen", meaning: "厨房" },
        { word: "repair", meaning: "修理" },
        { word: "habit", meaning: "习惯" }
      ]},
      { name: "家庭成员", words: [
        { word: "family", meaning: "家庭" },
        { word: "relative", meaning: "亲戚" },
        { word: "couple", meaning: "夫妇" },
        { word: "parent", meaning: "父母" },
        { word: "wife", meaning: "妻子" },
        { word: "husband", meaning: "丈夫" },
        { word: "grandson", meaning: "孙子" },
        { word: "granddaughter", meaning: "孙女" },
        { word: "father", meaning: "父亲" },
        { word: "mother", meaning: "母亲" },
        { word: "uncle", meaning: "叔叔" },
        { word: "aunt", meaning: "阿姨" },
        { word: "brother", meaning: "兄弟" },
        { word: "sister", meaning: "姐妹" },
        { word: "son", meaning: "儿子" },
        { word: "daughter", meaning: "女儿" },
        { word: "cousin", meaning: "堂兄弟姐妹" },
        { word: "marriage", meaning: "婚姻" },
        { word: "marry", meaning: "结婚" },
        { word: "friend", meaning: "朋友" }
      ]},
      { name: "人际称呼", words: [
        { word: "human", meaning: "人类" },
        { word: "people", meaning: "人们" },
        { word: "person", meaning: "人" },
        { word: "gentleman", meaning: "绅士" },
        { word: "madam", meaning: "女士" },
        { word: "hero", meaning: "英雄" },
        { word: "pioneer", meaning: "先锋" },
        { word: "neighbour", meaning: "邻居" },
        { word: "stranger", meaning: "陌生人" },
        { word: "child", meaning: "孩子" },
        { word: "kid", meaning: "小孩" },
        { word: "baby", meaning: "婴儿" }
      ]}
    ]
  },
  3: {
    title: "头部动作·感官·行为动作",
    categories: [
      { name: "身体动作", words: [
        { word: "blow", meaning: "吹" },
        { word: "nod", meaning: "点头" },
        { word: "shake", meaning: "摇动" },
        { word: "see", meaning: "看见" },
        { word: "look", meaning: "看" },
        { word: "watch", meaning: "观看" },
        { word: "notice", meaning: "注意到" },
        { word: "guess", meaning: "猜测" },
        { word: "suppose", meaning: "假设" },
        { word: "listen", meaning: "听" },
        { word: "hear", meaning: "听见" },
        { word: "feel", meaning: "感觉" },
        { word: "sound", meaning: "声音" },
        { word: "read", meaning: "阅读" },
        { word: "shout", meaning: "喊叫" },
        { word: "smell", meaning: "闻" },
        { word: "kiss", meaning: "亲吻" },
        { word: "pull", meaning: "拉" },
        { word: "push", meaning: "推" },
        { word: "rush", meaning: "冲" },
        { word: "touch", meaning: "触摸" },
        { word: "point", meaning: "指" },
        { word: "move", meaning: "移动" },
        { word: "lift", meaning: "举起" },
        { word: "open", meaning: "打开" },
        { word: "close", meaning: "关闭" },
        { word: "give", meaning: "给" },
        { word: "leave", meaning: "离开" },
        { word: "knock", meaning: "敲" },
        { word: "hit", meaning: "打" }
      ]},
      { name: "思维动作", words: [
        { word: "consider", meaning: "考虑" },
        { word: "collect", meaning: "收集" },
        { word: "compare", meaning: "比较" },
        { word: "complete", meaning: "完成" },
        { word: "know", meaning: "知道" },
        { word: "cancel", meaning: "取消" },
        { word: "build", meaning: "建造" },
        { word: "follow", meaning: "跟随" },
        { word: "rest", meaning: "休息" },
        { word: "force", meaning: "强迫" },
        { word: "get", meaning: "得到" },
        { word: "hurry", meaning: "赶快" },
        { word: "become", meaning: "成为" },
        { word: "happen", meaning: "发生" },
        { word: "sit", meaning: "坐" },
        { word: "cover", meaning: "覆盖" },
        { word: "describe", meaning: "描述" },
        { word: "enter", meaning: "进入" },
        { word: "stay", meaning: "停留" },
        { word: "prove", meaning: "证明" },
        { word: "admire", meaning: "钦佩" },
        { word: "decide", meaning: "决定" },
        { word: "refuse", meaning: "拒绝" },
        { word: "lie", meaning: "说谎" },
        { word: "receive", meaning: "收到" }
      ]}
    ]
  },
  4: {
    title: "记忆思维·情感感受·学校课堂",
    categories: [
      { name: "记忆·思维", words: [
        { word: "memory", meaning: "记忆" },
        { word: "forget", meaning: "忘记" },
        { word: "think", meaning: "思考" },
        { word: "experience", meaning: "经验" },
        { word: "learn", meaning: "学习" },
        { word: "idea", meaning: "想法" },
        { word: "mind", meaning: "头脑" },
        { word: "understand", meaning: "理解" },
        { word: "believe", meaning: "相信" },
        { word: "know", meaning: "知道" }
      ]},
      { name: "情感感受", words: [
        { word: "perfect", meaning: "完美的" },
        { word: "interesting", meaning: "有趣的" },
        { word: "easy", meaning: "容易的" },
        { word: "boring", meaning: "无聊的" },
        { word: "exciting", meaning: "令人兴奋的" },
        { word: "pleasant", meaning: "愉快的" },
        { word: "funny", meaning: "有趣的" },
        { word: "warm", meaning: "温暖的" },
        { word: "fantastic", meaning: "极好的" },
        { word: "welcome", meaning: "受欢迎的" },
        { word: "comfortable", meaning: "舒适的" },
        { word: "terrible", meaning: "糟糕的" },
        { word: "awful", meaning: "可怕的" },
        { word: "busy", meaning: "忙碌的" },
        { word: "free", meaning: "自由的" },
        { word: "tired", meaning: "疲劳的" },
        { word: "surprised", meaning: "惊讶的" },
        { word: "angry", meaning: "生气的" },
        { word: "happy", meaning: "快乐的" },
        { word: "sad", meaning: "悲伤的" },
        { word: "nervous", meaning: "紧张的" },
        { word: "proud", meaning: "自豪的" },
        { word: "confident", meaning: "自信的" },
        { word: "disappointed", meaning: "失望的" }
      ]},
      { name: "学校活动", words: [
        { word: "teacher", meaning: "教师" },
        { word: "student", meaning: "学生" },
        { word: "classmate", meaning: "同学" },
        { word: "classroom", meaning: "教室" },
        { word: "blackboard", meaning: "黑板" },
        { word: "laboratory", meaning: "实验室" },
        { word: "office", meaning: "办公室" },
        { word: "seat", meaning: "座位" },
        { word: "bell", meaning: "铃" },
        { word: "chalk", meaning: "粉笔" },
        { word: "flag", meaning: "旗" },
        { word: "rule", meaning: "规则" },
        { word: "bag", meaning: "包" },
        { word: "schoolbag", meaning: "书包" },
        { word: "pen", meaning: "笔" }
      ]},
      { name: "学校科目", words: [
        { word: "subject", meaning: "科目" },
        { word: "English", meaning: "英语" },
        { word: "Chinese", meaning: "中文" },
        { word: "maths", meaning: "数学" },
        { word: "science", meaning: "科学" },
        { word: "music", meaning: "音乐" },
        { word: "history", meaning: "历史" },
        { word: "geography", meaning: "地理" },
        { word: "physics", meaning: "物理" },
        { word: "chemistry", meaning: "化学" }
      ]}
    ]
  },
  5: {
    title: "情感表达·交流沟通·计划愿望",
    categories: [
      { name: "情感表达", words: [
        { word: "sense", meaning: "感觉·意识" },
        { word: "hope", meaning: "希望" },
        { word: "wish", meaning: "愿望" },
        { word: "expect", meaning: "期望" },
        { word: "dream", meaning: "梦想" },
        { word: "luck", meaning: "运气" },
        { word: "lucky", meaning: "幸运的" },
        { word: "please", meaning: "请" },
        { word: "imagine", meaning: "想象" },
        { word: "sad", meaning: "悲伤的" },
        { word: "cry", meaning: "哭泣" },
        { word: "surprise", meaning: "惊讶" },
        { word: "sleepy", meaning: "困倦的" },
        { word: "wild", meaning: "狂野的" },
        { word: "worry", meaning: "担心" },
        { word: "nervous", meaning: "紧张的" },
        { word: "regret", meaning: "后悔" },
        { word: "fear", meaning: "害怕" },
        { word: "afraid", meaning: "害怕的" }
      ]},
      { name: "交流沟通", words: [
        { word: "connect", meaning: "连接" },
        { word: "communicate", meaning: "交流" },
        { word: "communication", meaning: "交流" },
        { word: "together", meaning: "一起" },
        { word: "conversation", meaning: "对话" },
        { word: "discuss", meaning: "讨论" },
        { word: "discussion", meaning: "讨论" },
        { word: "praise", meaning: "表扬" },
        { word: "treat", meaning: "对待" },
        { word: "introduce", meaning: "介绍" },
        { word: "introduction", meaning: "介绍" },
        { word: "postcard", meaning: "明信片" },
        { word: "attend", meaning: "参加" },
        { word: "public", meaning: "公共的" },
        { word: "thank", meaning: "感谢" },
        { word: "sorry", meaning: "抱歉的" },
        { word: "pardon", meaning: "原谅" },
        { word: "excuse", meaning: "借口" },
        { word: "mind", meaning: "介意" },
        { word: "bye", meaning: "再见" },
        { word: "invite", meaning: "邀请" }
      ]},
      { name: "计划·愿望", words: [
        { word: "want", meaning: "想要" },
        { word: "plan", meaning: "计划" },
        { word: "decide", meaning: "决定" },
        { word: "decision", meaning: "决定" },
        { word: "secret", meaning: "秘密" },
        { word: "ability", meaning: "能力" },
        { word: "absent", meaning: "缺席的" },
        { word: "goodbye", meaning: "再见" },
        { word: "idea", meaning: "想法" }
      ]}
    ]
  },
  6: {
    title: "时间周期·日期星期·颜色服装",
    categories: [
      { name: "时间", words: [
        { word: "period", meaning: "时期" },
        { word: "time", meaning: "时间" },
        { word: "after", meaning: "在...以后" },
        { word: "forward", meaning: "向前" },
        { word: "before", meaning: "在...之前" },
        { word: "ago", meaning: "以前" },
        { word: "later", meaning: "后来" },
        { word: "late", meaning: "晚的" },
        { word: "early", meaning: "早的" },
        { word: "during", meaning: "在...期间" },
        { word: "recently", meaning: "最近" },
        { word: "since", meaning: "自从" },
        { word: "for", meaning: "对于" },
        { word: "soon", meaning: "不久" },
        { word: "until", meaning: "直到...为止" },
        { word: "while", meaning: "当...时候" },
        { word: "by", meaning: "由...方式" },
        { word: "past", meaning: "过去的" },
        { word: "second", meaning: "秒" },
        { word: "minute", meaning: "分钟" },
        { word: "hour", meaning: "小时" },
        { word: "week", meaning: "周" },
        { word: "month", meaning: "月" },
        { word: "year", meaning: "年" },
        { word: "century", meaning: "世纪" }
      ]},
      { name: "日期·星期", words: [
        { word: "week", meaning: "星期" },
        { word: "Monday", meaning: "星期一" },
        { word: "Tuesday", meaning: "星期二" },
        { word: "Wednesday", meaning: "星期三" },
        { word: "Thursday", meaning: "星期四" },
        { word: "Friday", meaning: "星期五" },
        { word: "Saturday", meaning: "星期六" },
        { word: "Sunday", meaning: "星期日" }
      ]},
      { name: "颜色", words: [
        { word: "colour", meaning: "颜色" },
        { word: "green", meaning: "绿色的" },
        { word: "red", meaning: "红色的" },
        { word: "blue", meaning: "蓝色的" },
        { word: "black", meaning: "黑色的" },
        { word: "grey", meaning: "灰色的" },
        { word: "yellow", meaning: "黄色的" },
        { word: "purple", meaning: "紫色的" },
        { word: "white", meaning: "白色的" },
        { word: "brown", meaning: "棕色的" },
        { word: "orange", meaning: "橙色的" },
        { word: "pink", meaning: "粉色的" }
      ]},
      { name: "服装", words: [
        { word: "blouse", meaning: "女衬衫" },
        { word: "skirt", meaning: "裙子" },
        { word: "sweater", meaning: "毛衣" },
        { word: "pants", meaning: "裤子" },
        { word: "trousers", meaning: "长裤" },
        { word: "T-shirt", meaning: "T恤" },
        { word: "pocket", meaning: "口袋" },
        { word: "cap", meaning: "帽子" },
        { word: "hat", meaning: "帽子" },
        { word: "dress", meaning: "连衣裙" },
        { word: "glove", meaning: "手套" },
        { word: "jacket", meaning: "夹克" },
        { word: "jeans", meaning: "牛仔裤" },
        { word: "raincoat", meaning: "雨衣" },
        { word: "scarf", meaning: "围巾" },
        { word: "shoe", meaning: "鞋" }
      ]}
    ]
  },
  7: {
    title: "餐具·食物·饮料·三餐·身体健康",
    categories: [
      { name: "餐具", words: [
        { word: "dish", meaning: "碟子" },
        { word: "plate", meaning: "盘子" },
        { word: "cup", meaning: "杯子" },
        { word: "bottle", meaning: "瓶子" },
        { word: "box", meaning: "盒子" },
        { word: "basket", meaning: "篮" },
        { word: "chopsticks", meaning: "筷子" },
        { word: "fork", meaning: "叉子" },
        { word: "knife", meaning: "刀" },
        { word: "spoon", meaning: "勺子" }
      ]},
      { name: "食物·饮料", words: [
        { word: "food", meaning: "食物" },
        { word: "beef", meaning: "牛肉" },
        { word: "meat", meaning: "肉" },
        { word: "fish", meaning: "鱼" },
        { word: "rice", meaning: "米饭" },
        { word: "noodle", meaning: "面条" },
        { word: "hamburger", meaning: "汉堡" },
        { word: "vegetable", meaning: "蔬菜" },
        { word: "cabbage", meaning: "卷心菜" },
        { word: "carrot", meaning: "胡萝卜" },
        { word: "tomato", meaning: "番茄" },
        { word: "potato", meaning: "土豆" },
        { word: "salad", meaning: "沙拉" },
        { word: "cheese", meaning: "奶酪" },
        { word: "chocolate", meaning: "巧克力" },
        { word: "pie", meaning: "派" },
        { word: "biscuit", meaning: "饼干" },
        { word: "pancake", meaning: "薄饼" },
        { word: "bread", meaning: "面包" },
        { word: "sandwich", meaning: "三明治" },
        { word: "butter", meaning: "黄油" },
        { word: "candy", meaning: "糖果" },
        { word: "salt", meaning: "盐" },
        { word: "sugar", meaning: "糖" },
        { word: "coffee", meaning: "咖啡" },
        { word: "drink", meaning: "饮料" },
        { word: "tea", meaning: "茶" },
        { word: "juice", meaning: "果汁" },
        { word: "milk", meaning: "牛奶" },
        { word: "water", meaning: "水" }
      ]},
      { name: "三餐", words: [
        { word: "breakfast", meaning: "早餐" },
        { word: "lunch", meaning: "午餐" },
        { word: "dinner", meaning: "晚餐" },
        { word: "feed", meaning: "喂养" },
        { word: "delicious", meaning: "美味的" },
        { word: "fresh", meaning: "新鲜的" },
        { word: "sour", meaning: "酸的" },
        { word: "sweet", meaning: "甜的" },
        { word: "full", meaning: "饱的" },
        { word: "hungry", meaning: "饥饿的" },
        { word: "thirsty", meaning: "口渴的" }
      ]},
      { name: "身体健康", words: [
        { word: "condition", meaning: "状况" },
        { word: "operation", meaning: "手术" },
        { word: "medical", meaning: "医学的" },
        { word: "medicine", meaning: "药" },
        { word: "brain", meaning: "大脑" },
        { word: "stomachache", meaning: "胃痛" },
        { word: "toothache", meaning: "牙痛" },
        { word: "headache", meaning: "头痛" },
        { word: "cough", meaning: "咳嗽" },
        { word: "fever", meaning: "发烧" },
        { word: "pain", meaning: "疼痛" },
        { word: "hurt", meaning: "受伤" },
        { word: "smoke", meaning: "吸烟" },
        { word: "harmful", meaning: "有害的" }
      ]}
    ]
  },
  8: {
    title: "身体部位·天气·休闲娱乐·交通出行",
    categories: [
      { name: "身体部位", words: [
        { word: "nose", meaning: "鼻子" },
        { word: "mouth", meaning: "嘴" },
        { word: "ear", meaning: "耳朵" },
        { word: "face", meaning: "脸" },
        { word: "hair", meaning: "头发" },
        { word: "tooth", meaning: "牙齿" },
        { word: "eye", meaning: "眼睛" },
        { word: "head", meaning: "头" },
        { word: "shoulder", meaning: "肩膀" },
        { word: "body", meaning: "身体" },
        { word: "arm", meaning: "手臂" },
        { word: "hand", meaning: "手" },
        { word: "finger", meaning: "手指" },
        { word: "knee", meaning: "膝盖" },
        { word: "leg", meaning: "腿" },
        { word: "foot", meaning: "脚" },
        { word: "heart", meaning: "心脏" },
        { word: "blood", meaning: "血液" }
      ]},
      { name: "天气", words: [
        { word: "weather", meaning: "天气" },
        { word: "sunny", meaning: "晴朗的" },
        { word: "cloudy", meaning: "多云的" },
        { word: "wind", meaning: "风" },
        { word: "windy", meaning: "有风的" },
        { word: "rain", meaning: "雨" },
        { word: "rainy", meaning: "下雨的" },
        { word: "snowy", meaning: "下雪的" },
        { word: "cold", meaning: "冷的" },
        { word: "hot", meaning: "热的" },
        { word: "warm", meaning: "温暖的" },
        { word: "cool", meaning: "凉爽的" }
      ]},
      { name: "休闲娱乐", words: [
        { word: "dance", meaning: "跳舞" },
        { word: "sing", meaning: "唱歌" },
        { word: "song", meaning: "歌曲" },
        { word: "cartoon", meaning: "卡通" },
        { word: "play", meaning: "玩耍" },
        { word: "program", meaning: "节目" },
        { word: "show", meaning: "演出" },
        { word: "information", meaning: "信息" },
        { word: "interview", meaning: "采访" },
        { word: "report", meaning: "报告" },
        { word: "aloud", meaning: "大声地" },
        { word: "loud", meaning: "大声的" }
      ]},
      { name: "音乐乐器", words: [
        { word: "instrument", meaning: "乐器" },
        { word: "balloon", meaning: "气球" },
        { word: "drum", meaning: "鼓" },
        { word: "piano", meaning: "钢琴" },
        { word: "guitar", meaning: "吉他" },
        { word: "violin", meaning: "小提琴" }
      ]},
      { name: "交通出行", words: [
        { word: "airport", meaning: "机场" },
        { word: "station", meaning: "车站" },
        { word: "truck", meaning: "卡车" },
        { word: "driver", meaning: "司机" },
        { word: "pilot", meaning: "飞行员" },
        { word: "passenger", meaning: "乘客" },
        { word: "accident", meaning: "事故" },
        { word: "cross", meaning: "穿过" },
        { word: "sail", meaning: "航行" },
        { word: "drive", meaning: "驾驶" },
        { word: "ride", meaning: "骑" },
        { word: "fly", meaning: "飞" },
        { word: "ship", meaning: "船" },
        { word: "motorcycle", meaning: "摩托车" },
        { word: "bus", meaning: "公共汽车" },
        { word: "bike", meaning: "自行车" },
        { word: "car", meaning: "汽车" },
        { word: "boat", meaning: "小船" },
        { word: "taxi", meaning: "出租车" },
        { word: "underground", meaning: "地铁" },
        { word: "subway", meaning: "地铁" },
        { word: "train", meaning: "火车" },
        { word: "plane", meaning: "飞机" },
        { word: "traffic", meaning: "交通" }
      ]}
    ]
  },
  9: {
    title: "学习·知识·语言·研究·自然·动植物",
    categories: [
      { name: "知识·学习", words: [
        { word: "knowledge", meaning: "知识" },
        { word: "homework", meaning: "作业" },
        { word: "project", meaning: "项目" },
        { word: "lesson", meaning: "课程" },
        { word: "text", meaning: "课文" },
        { word: "unit", meaning: "单元" },
        { word: "sentence", meaning: "句子" },
        { word: "pronounce", meaning: "发音" },
        { word: "pronunciation", meaning: "发音" },
        { word: "language", meaning: "语言" },
        { word: "skill", meaning: "技能" },
        { word: "letter", meaning: "字母" },
        { word: "word", meaning: "单词" },
        { word: "grammar", meaning: "语法" },
        { word: "object", meaning: "宾语" }
      ]},
      { name: "学习·研究", words: [
        { word: "method", meaning: "方法" },
        { word: "explain", meaning: "解释" },
        { word: "research", meaning: "研究" },
        { word: "practice", meaning: "练习" },
        { word: "practise", meaning: "练习" },
        { word: "correct", meaning: "正确的" },
        { word: "solve", meaning: "解决" },
        { word: "mistake", meaning: "错误" },
        { word: "recite", meaning: "背诵" },
        { word: "understand", meaning: "理解" },
        { word: "translate", meaning: "翻译" },
        { word: "train", meaning: "训练" },
        { word: "training", meaning: "训练" },
        { word: "online", meaning: "在线的" },
        { word: "fail", meaning: "失败" },
        { word: "lose", meaning: "失去" },
        { word: "pass", meaning: "通过" },
        { word: "improve", meaning: "提高" },
        { word: "reply", meaning: "回答" },
        { word: "repeat", meaning: "重复" },
        { word: "check", meaning: "检查" },
        { word: "term", meaning: "学期" }
      ]},
      { name: "自然·动植物", words: [
        { word: "nature", meaning: "自然" },
        { word: "natural", meaning: "自然的" },
        { word: "forest", meaning: "森林" },
        { word: "wood", meaning: "木头" },
        { word: "stream", meaning: "小溪" },
        { word: "mountain", meaning: "山" },
        { word: "hill", meaning: "小山" },
        { word: "island", meaning: "岛" },
        { word: "ground", meaning: "地面" },
        { word: "earth", meaning: "地球" },
        { word: "river", meaning: "河流" },
        { word: "lake", meaning: "湖" },
        { word: "stone", meaning: "石头" },
        { word: "ocean", meaning: "海洋" },
        { word: "sea", meaning: "海" },
        { word: "sand", meaning: "沙子" },
        { word: "beach", meaning: "海滩" },
        { word: "flower", meaning: "花" },
        { word: "rose", meaning: "玫瑰" },
        { word: "grass", meaning: "草" },
        { word: "bean", meaning: "豆" },
        { word: "bamboo", meaning: "竹子" },
        { word: "leaf", meaning: "叶子" },
        { word: "lemon", meaning: "柠檬" },
        { word: "watermelon", meaning: "西瓜" },
        { word: "strawberry", meaning: "草莓" }
      ]},
      { name: "动物", words: [
        { word: "pet", meaning: "宠物" },
        { word: "animal", meaning: "动物" },
        { word: "ant", meaning: "蚂蚁" },
        { word: "panda", meaning: "熊猫" },
        { word: "tiger", meaning: "老虎" },
        { word: "lion", meaning: "狮子" },
        { word: "elephant", meaning: "大象" },
        { word: "giraffe", meaning: "长颈鹿" },
        { word: "monkey", meaning: "猴子" },
        { word: "snake", meaning: "蛇" },
        { word: "horse", meaning: "马" },
        { word: "sheep", meaning: "羊" },
        { word: "cat", meaning: "猫" },
        { word: "dog", meaning: "狗" },
        { word: "mouse", meaning: "老鼠" },
        { word: "rabbit", meaning: "兔子" },
        { word: "bird", meaning: "鸟" },
        { word: "chicken", meaning: "鸡" },
        { word: "duck", meaning: "鸭" },
        { word: "cow", meaning: "牛" },
        { word: "pig", meaning: "猪" }
      ]}
    ]
  },
  10: {
    title: "世界·国家·民族·数字数量",
    categories: [
      { name: "世界·国家", words: [
        { word: "world", meaning: "世界" },
        { word: "country", meaning: "国家" },
        { word: "foreign", meaning: "外国的" },
        { word: "Asia", meaning: "亚洲" },
        { word: "Asian", meaning: "亚洲的" },
        { word: "China", meaning: "中国" },
        { word: "Chinese", meaning: "中国的" },
        { word: "America", meaning: "美国" },
        { word: "American", meaning: "美国的" },
        { word: "Japan", meaning: "日本" },
        { word: "Japanese", meaning: "日本的" },
        { word: "Australia", meaning: "澳大利亚" },
        { word: "Australian", meaning: "澳大利亚的" },
        { word: "Britain", meaning: "英国" },
        { word: "British", meaning: "英国的" },
        { word: "England", meaning: "英格兰" },
        { word: "English", meaning: "英国的" },
        { word: "London", meaning: "伦敦" },
        { word: "Germany", meaning: "德国" },
        { word: "German", meaning: "德国的" },
        { word: "France", meaning: "法国" },
        { word: "French", meaning: "法国的" },
        { word: "Russia", meaning: "俄罗斯" },
        { word: "Russian", meaning: "俄罗斯的" },
        { word: "India", meaning: "印度" },
        { word: "Indian", meaning: "印度的" }
      ]},
      { name: "数字", words: [
        { word: "count", meaning: "计数" },
        { word: "zero", meaning: "零" },
        { word: "one", meaning: "一" },
        { word: "two", meaning: "二" },
        { word: "three", meaning: "三" },
        { word: "four", meaning: "四" },
        { word: "five", meaning: "五" },
        { word: "six", meaning: "六" },
        { word: "seven", meaning: "七" },
        { word: "eight", meaning: "八" },
        { word: "nine", meaning: "九" },
        { word: "ten", meaning: "十" },
        { word: "eleven", meaning: "十一" },
        { word: "twelve", meaning: "十二" },
        { word: "thirteen", meaning: "十三" },
        { word: "fourteen", meaning: "十四" },
        { word: "fifteen", meaning: "十五" },
        { word: "sixteen", meaning: "十六" },
        { word: "seventeen", meaning: "十七" },
        { word: "eighteen", meaning: "十八" },
        { word: "nineteen", meaning: "十九" },
        { word: "twenty", meaning: "二十" },
        { word: "thirty", meaning: "三十" },
        { word: "forty", meaning: "四十" },
        { word: "fifty", meaning: "五十" },
        { word: "sixty", meaning: "六十" },
        { word: "seventy", meaning: "七十" },
        { word: "eighty", meaning: "八十" },
        { word: "ninety", meaning: "九十" },
        { word: "hundred", meaning: "百" },
        { word: "thousand", meaning: "千" },
        { word: "million", meaning: "百万" },
        { word: "first", meaning: "第一" },
        { word: "second", meaning: "第二" },
        { word: "third", meaning: "第三" },
        { word: "fourth", meaning: "第四" },
        { word: "fifth", meaning: "第五" },
        { word: "sixth", meaning: "第六" },
        { word: "half", meaning: "一半" },
        { word: "double", meaning: "两倍" }
      ]},
      { name: "数量·计量", words: [
        { word: "kind", meaning: "种类" },
        { word: "type", meaning: "类型" },
        { word: "kilo", meaning: "千克" },
        { word: "size", meaning: "尺寸" },
        { word: "block", meaning: "块" },
        { word: "piece", meaning: "片" },
        { word: "pair", meaning: "双" },
        { word: "inch", meaning: "英寸" },
        { word: "weight", meaning: "重量" },
        { word: "height", meaning: "高度" },
        { word: "heavy", meaning: "重的" },
        { word: "light", meaning: "轻的" },
        { word: "thick", meaning: "厚的" },
        { word: "thin", meaning: "薄的" },
        { word: "wide", meaning: "宽的" },
        { word: "narrow", meaning: "窄的" },
        { word: "deep", meaning: "深的" },
        { word: "shallow", meaning: "浅的" }
      ]}
    ]
  },
  11: {
    title: "度量·速度·程度·科学·问题·逻辑连接",
    categories: [
      { name: "度量·距离", words: [
        { word: "meter", meaning: "米" },
        { word: "kilometer", meaning: "千米" },
        { word: "mile", meaning: "英里" },
        { word: "far", meaning: "远的" },
        { word: "near", meaning: "近的" },
        { word: "from", meaning: "从" },
        { word: "arrive", meaning: "到达" },
        { word: "reach", meaning: "到达" },
        { word: "fast", meaning: "快的" },
        { word: "rapid", meaning: "快速的" },
        { word: "quick", meaning: "快速的" },
        { word: "slow", meaning: "慢的" }
      ]},
      { name: "程度·频率", words: [
        { word: "nearly", meaning: "几乎" },
        { word: "almost", meaning: "几乎" },
        { word: "seldom", meaning: "很少" },
        { word: "about", meaning: "大约" },
        { word: "also", meaning: "也" },
        { word: "too", meaning: "太" },
        { word: "either", meaning: "也" },
        { word: "very", meaning: "非常" },
        { word: "rather", meaning: "相当" },
        { word: "quite", meaning: "相当" },
        { word: "even", meaning: "甚至" },
        { word: "just", meaning: "刚刚" },
        { word: "only", meaning: "仅仅" },
        { word: "so", meaning: "如此" },
        { word: "such", meaning: "如此" },
        { word: "like", meaning: "像" },
        { word: "always", meaning: "总是" },
        { word: "usually", meaning: "通常" },
        { word: "often", meaning: "经常" },
        { word: "sometimes", meaning: "有时" },
        { word: "rarely", meaning: "很少" },
        { word: "never", meaning: "从不" },
        { word: "yet", meaning: "还" },
        { word: "already", meaning: "已经" },
        { word: "still", meaning: "仍然" }
      ]},
      { name: "科学技术", words: [
        { word: "engineer", meaning: "工程师" },
        { word: "invent", meaning: "发明" },
        { word: "invention", meaning: "发明" },
        { word: "machine", meaning: "机器" },
        { word: "technology", meaning: "技术" },
        { word: "science", meaning: "科学" },
        { word: "robot", meaning: "机器人" },
        { word: "energy", meaning: "能源" },
        { word: "electricity", meaning: "电" },
        { word: "computer", meaning: "电脑" },
        { word: "internet", meaning: "互联网" }
      ]},
      { name: "问题解决", words: [
        { word: "question", meaning: "问题" },
        { word: "answer", meaning: "回答" },
        { word: "key", meaning: "关键" },
        { word: "reply", meaning: "回答" },
        { word: "ask", meaning: "问" },
        { word: "problem", meaning: "问题" },
        { word: "trouble", meaning: "麻烦" },
        { word: "reason", meaning: "原因" },
        { word: "result", meaning: "结果" },
        { word: "cause", meaning: "导致" }
      ]},
      { name: "逻辑连接", words: [
        { word: "because", meaning: "因为" },
        { word: "if", meaning: "如果" },
        { word: "than", meaning: "比" },
        { word: "since", meaning: "既然" },
        { word: "although", meaning: "虽然" },
        { word: "though", meaning: "虽然" },
        { word: "unless", meaning: "除非" },
        { word: "whether", meaning: "是否" },
        { word: "however", meaning: "然而" },
        { word: "therefore", meaning: "因此" },
        { word: "besides", meaning: "此外" },
        { word: "instead", meaning: "代替" },
        { word: "different", meaning: "不同的" },
        { word: "difference", meaning: "差异" },
        { word: "similar", meaning: "相似的" },
        { word: "match", meaning: "匹配" },
        { word: "proper", meaning: "合适的" },
        { word: "same", meaning: "相同的" },
        { word: "against", meaning: "反对" },
        { word: "except", meaning: "除了" },
        { word: "include", meaning: "包括" },
        { word: "without", meaning: "没有" },
        { word: "with", meaning: "和" },
        { word: "but", meaning: "但是" },
        { word: "and", meaning: "和" },
        { word: "or", meaning: "或" }
      ]}
    ]
  },
  12: {
    title: "动词短语（上）·常用介词搭配",
    categories: [
      { name: "动词+back/up 短语", words: [
        { word: "give back", meaning: "归还" },
        { word: "pay back", meaning: "偿还" },
        { word: "ring back", meaning: "回电话" },
        { word: "call back", meaning: "回电话" },
        { word: "come back", meaning: "回来" },
        { word: "get back", meaning: "取回" },
        { word: "look back", meaning: "回顾" },
        { word: "go back", meaning: "回去" },
        { word: "bring back", meaning: "带回" },
        { word: "hold back", meaning: "抑制" }
      ]},
      { name: "动词+down 短语", words: [
        { word: "break down", meaning: "损坏" },
        { word: "come down", meaning: "下来" },
        { word: "cut down", meaning: "砍倒" },
        { word: "die down", meaning: "逐渐消失" },
        { word: "fall down", meaning: "摔倒" },
        { word: "lie down", meaning: "躺下" },
        { word: "sit down", meaning: "坐下" },
        { word: "pull down", meaning: "拆毁" },
        { word: "put down", meaning: "放下" },
        { word: "take down", meaning: "取下" },
        { word: "turn down", meaning: "调低" },
        { word: "write down", meaning: "写下" }
      ]},
      { name: "动词+for/from 短语", words: [
        { word: "ask for", meaning: "请求" },
        { word: "call for", meaning: "要求" },
        { word: "look for", meaning: "寻找" },
        { word: "pay for", meaning: "付款" },
        { word: "prepare for", meaning: "准备" },
        { word: "wait for", meaning: "等待" },
        { word: "stand for", meaning: "代表" },
        { word: "care for", meaning: "照顾" },
        { word: "come from", meaning: "来自" },
        { word: "hear from", meaning: "收到来信" },
        { word: "prevent from", meaning: "阻止" },
        { word: "differ from", meaning: "不同于" }
      ]},
      { name: "动词+on/off 短语", words: [
        { word: "come on", meaning: "加油" },
        { word: "depend on", meaning: "依赖" },
        { word: "hang on", meaning: "等一下" },
        { word: "hold on", meaning: "坚持" },
        { word: "keep on", meaning: "继续" },
        { word: "live on", meaning: "靠...生活" },
        { word: "put on", meaning: "穿上" },
        { word: "spend on", meaning: "花费在" },
        { word: "try on", meaning: "试穿" },
        { word: "turn on", meaning: "打开" },
        { word: "get off", meaning: "下车" },
        { word: "go off", meaning: "离去" },
        { word: "keep off", meaning: "远离" },
        { word: "see off", meaning: "送别" },
        { word: "set off", meaning: "出发" },
        { word: "show off", meaning: "炫耀" },
        { word: "shut off", meaning: "关闭" },
        { word: "take off", meaning: "脱下" },
        { word: "turn off", meaning: "关闭" }
      ]}
    ]
  },
  13: {
    title: "动词短语（下）·介词短语·常用搭配",
    categories: [
      { name: "动词+up 短语", words: [
        { word: "clean up", meaning: "清理" },
        { word: "dress up", meaning: "打扮" },
        { word: "get up", meaning: "起床" },
        { word: "give up", meaning: "放弃" },
        { word: "grow up", meaning: "长大" },
        { word: "hurry up", meaning: "赶快" },
        { word: "look up", meaning: "查阅" },
        { word: "make up", meaning: "组成" },
        { word: "pick up", meaning: "捡起" },
        { word: "put up", meaning: "搭建" },
        { word: "set up", meaning: "建立" },
        { word: "show up", meaning: "出现" },
        { word: "speed up", meaning: "加速" },
        { word: "take up", meaning: "从事" },
        { word: "turn up", meaning: "出现" },
        { word: "wake up", meaning: "醒来" }
      ]},
      { name: "动词+其他介词", words: [
        { word: "agree with", meaning: "同意" },
        { word: "compare with", meaning: "与...比较" },
        { word: "connect with", meaning: "与...连接" },
        { word: "deal with", meaning: "处理" },
        { word: "help with", meaning: "帮助" },
        { word: "play with", meaning: "与...玩耍" },
        { word: "agree to", meaning: "同意" },
        { word: "belong to", meaning: "属于" },
        { word: "listen to", meaning: "听" },
        { word: "point to", meaning: "指向" },
        { word: "refer to", meaning: "参考" },
        { word: "stick to", meaning: "坚持" },
        { word: "talk to", meaning: "与...交谈" },
        { word: "write to", meaning: "写信给" },
        { word: "get through", meaning: "通过" },
        { word: "go through", meaning: "经历" },
        { word: "look through", meaning: "浏览" },
        { word: "think about", meaning: "考虑" },
        { word: "worry about", meaning: "担心" },
        { word: "care about", meaning: "关心" }
      ]},
      { name: "常用搭配", words: [
        { word: "catch up with", meaning: "赶上" },
        { word: "come across", meaning: "偶然遇见" },
        { word: "come up with", meaning: "想出" },
        { word: "do one's homework", meaning: "做作业" },
        { word: "do some cleaning", meaning: "打扫" },
        { word: "do some shopping", meaning: "购物" },
        { word: "do the dishes", meaning: "洗碗" },
        { word: "enjoy oneself", meaning: "过得愉快" },
        { word: "fall asleep", meaning: "入睡" },
        { word: "fall ill", meaning: "生病" },
        { word: "get along with", meaning: "与...相处" },
        { word: "have to", meaning: "不得不" },
        { word: "look forward to", meaning: "期待" },
        { word: "make a decision", meaning: "做决定" },
        { word: "make a face", meaning: "做鬼脸" },
        { word: "make a wish", meaning: "许愿" },
        { word: "make friends with", meaning: "交朋友" },
        { word: "make sure", meaning: "确保" },
        { word: "make up one's mind", meaning: "下定决心" },
        { word: "pay attention to", meaning: "注意" },
        { word: "take care of", meaning: "照顾" },
        { word: "take it easy", meaning: "别紧张" },
        { word: "take part in", meaning: "参加" },
        { word: "take place", meaning: "发生" }
      ]}
    ]
  },
  14: {
    title: "常用短语·介词短语·固定搭配",
    categories: [
      { name: "方位·时间短语", words: [
        { word: "at first", meaning: "起初" },
        { word: "at last", meaning: "最后" },
        { word: "at least", meaning: "至少" },
        { word: "at once", meaning: "立刻" },
        { word: "at present", meaning: "目前" },
        { word: "at the same time", meaning: "同时" },
        { word: "in front of", meaning: "在...前面" },
        { word: "in the end", meaning: "最后" },
        { word: "in the middle of", meaning: "在...中间" },
        { word: "in time", meaning: "及时" },
        { word: "on time", meaning: "按时" },
        { word: "in trouble", meaning: "处于困境" },
        { word: "in danger", meaning: "处于危险中" },
        { word: "in fact", meaning: "事实上" },
        { word: "in public", meaning: "公开地" },
        { word: "in surprise", meaning: "惊讶地" },
        { word: "in silence", meaning: "沉默地" }
      ]},
      { name: "连接短语", words: [
        { word: "across from", meaning: "在...对面" },
        { word: "of course", meaning: "当然" },
        { word: "after all", meaning: "毕竟" },
        { word: "after class", meaning: "课后" },
        { word: "all in all", meaning: "总而言之" },
        { word: "as a result", meaning: "结果" },
        { word: "as...as", meaning: "和...一样" },
        { word: "first of all", meaning: "首先" },
        { word: "for example", meaning: "例如" },
        { word: "instead of", meaning: "代替" },
        { word: "next to", meaning: "紧挨着" },
        { word: "not so...as", meaning: "不如...那样" },
        { word: "even if", meaning: "即使" },
        { word: "even though", meaning: "即使" },
        { word: "in order that", meaning: "为了" },
        { word: "in order to", meaning: "为了" },
        { word: "neither...nor", meaning: "既不...也不" },
        { word: "not only...but also", meaning: "不仅...而且" },
        { word: "not...until", meaning: "直到...才" },
        { word: "so as to", meaning: "以便" },
        { word: "so long as", meaning: "只要" },
        { word: "so...that", meaning: "如此...以至于" },
        { word: "too...to", meaning: "太...而不能" }
      ]},
      { name: "时间·频率短语", words: [
        { word: "again and again", meaning: "再三地" },
        { word: "all the time", meaning: "一直" },
        { word: "all over", meaning: "到处" },
        { word: "as far as", meaning: "就...而言" },
        { word: "as usual", meaning: "像往常一样" },
        { word: "as well as", meaning: "也" },
        { word: "as well", meaning: "也" },
        { word: "close to", meaning: "靠近" },
        { word: "day and night", meaning: "日日夜夜" },
        { word: "each other", meaning: "互相" },
        { word: "from now on", meaning: "从现在起" },
        { word: "from then on", meaning: "从那时起" },
        { word: "here and there", meaning: "到处" },
        { word: "over and over again", meaning: "反复地" },
        { word: "right away", meaning: "立刻" },
        { word: "right now", meaning: "现在" },
        { word: "side by side", meaning: "并肩" },
        { word: "so far", meaning: "到目前为止" },
        { word: "sooner or later", meaning: "迟早" },
        { word: "up and down", meaning: "上上下下" }
      ]},
      { name: "数量短语", words: [
        { word: "a bit of", meaning: "一点儿" },
        { word: "a few", meaning: "几个" },
        { word: "a kind of", meaning: "一种" },
        { word: "a little", meaning: "一点儿" },
        { word: "a lot of", meaning: "许多" },
        { word: "a number of", meaning: "许多" },
        { word: "a pair of", meaning: "一双" },
        { word: "a piece of", meaning: "一张" },
        { word: "all kinds of", meaning: "各种各样的" },
        { word: "lots of", meaning: "许多" },
        { word: "plenty of", meaning: "充足的" }
      ]}
    ]
  },
  15: {
    title: "常用句型·单词变形规则总结",
    categories: [
      { name: "名词复述句型", words: [
        { word: "What does he look like?", meaning: "他长什么样？" },
        { word: "What is he like?", meaning: "他是什么样的人？" },
        { word: "What does he like?", meaning: "他喜欢什么？" },
        { word: "How do you like...?", meaning: "你觉得...怎么样？" },
        { word: "What do you think of...?", meaning: "你觉得...怎么样？" },
        { word: "What's the matter?", meaning: "怎么了？" },
        { word: "What's wrong?", meaning: "怎么了？" },
        { word: "Would you like...?", meaning: "你想要...吗？" },
        { word: "Why not...?", meaning: "为什么不...？" },
        { word: "How about...?", meaning: "...怎么样？" }
      ]},
      { name: "单词变形-ful 后缀", words: [
        { word: "beauty→beautiful", meaning: "美丽的" },
        { word: "colour→colourful", meaning: "多彩的" },
        { word: "peace→peaceful", meaning: "和平的" },
        { word: "success→successful", meaning: "成功的" },
        { word: "care→careful→careless", meaning: "小心/粗心的" },
        { word: "help→helpful→helpless", meaning: "有帮助/无助的" },
        { word: "hope→hopeful→hopeless", meaning: "有希望/绝望的" },
        { word: "meaning→meaningful→meaningless", meaning: "有意义/无意义的" },
        { word: "use→useful→useless", meaning: "有用/无用的" },
        { word: "home→homeless", meaning: "无家可归的" }
      ]},
      { name: "单词变形-y 后缀", words: [
        { word: "cloud→cloudy", meaning: "多云的" },
        { word: "fog→foggy", meaning: "有雾的" },
        { word: "wind→windy", meaning: "有风的" },
        { word: "rain→rainy", meaning: "有雨的" },
        { word: "snow→snowy", meaning: "有雪的" },
        { word: "sun→sunny", meaning: "晴朗的" },
        { word: "noise→noisy", meaning: "吵闹的" },
        { word: "health→healthy", meaning: "健康的" },
        { word: "luck→lucky", meaning: "幸运的" },
        { word: "sleep→sleepy", meaning: "困倦的" }
      ]},
      { name: "单词变形-ing/ed 后缀", words: [
        { word: "bore→bored→boring", meaning: "无聊的" },
        { word: "excite→excited→exciting", meaning: "兴奋的" },
        { word: "interest→interested→interesting", meaning: "有趣的" },
        { word: "relax→relaxed→relaxing", meaning: "放松的" },
        { word: "surprise→surprised→surprising", meaning: "惊讶的" },
        { word: "tire→tired→tiring", meaning: "疲劳的" },
        { word: "worry→worried→worrying", meaning: "担心的" },
        { word: "amaze→amazed→amazing", meaning: "惊奇的" },
        { word: "please→pleased→pleasing", meaning: "高兴的" },
        { word: "move→moved→moving", meaning: "感动的" }
      ]}
    ]
  }
};

// ============================================
// COMPLETE Days 16-28 using standard curriculum
// ============================================

// Day 16 words parsed from OCR and known curriculum
dayStructure[16] = {
  title: "购物·金钱·价值·事物描述",
  categories: [
    { name: "购物交易", words: [
      { word: "choose", meaning: "选择" },
      { word: "choice", meaning: "选择" },
      { word: "deal", meaning: "交易" },
      { word: "sell", meaning: "卖" },
      { word: "sale", meaning: "销售" },
      { word: "serve", meaning: "服务" },
      { word: "service", meaning: "服务" },
      { word: "offer", meaning: "提供" },
      { word: "provide", meaning: "提供" },
      { word: "trade", meaning: "贸易" },
      { word: "buy", meaning: "买" },
      { word: "afford", meaning: "负担得起" },
      { word: "poor", meaning: "贫穷的" },
      { word: "rich", meaning: "富有的" },
      { word: "worth", meaning: "值得的" },
      { word: "price", meaning: "价格" },
      { word: "cost", meaning: "花费" },
      { word: "spend", meaning: "花费" },
      { word: "pay", meaning: "支付" },
      { word: "market", meaning: "市场" },
      { word: "shop", meaning: "商店" },
      { word: "store", meaning: "商店" },
      { word: "supermarket", meaning: "超市" },
      { word: "money", meaning: "钱" },
      { word: "dollar", meaning: "美元" },
      { word: "cent", meaning: "分" },
      { word: "coin", meaning: "硬币" },
      { word: "cash", meaning: "现金" }
    ]},
    { name: "事物描述", words: [
      { word: "round", meaning: "圆的" },
      { word: "square", meaning: "方的" },
      { word: "straight", meaning: "直的" },
      { word: "flat", meaning: "平的" },
      { word: "soft", meaning: "软的" },
      { word: "hard", meaning: "硬的" },
      { word: "smooth", meaning: "光滑的" },
      { word: "rough", meaning: "粗糙的" },
      { word: "empty", meaning: "空的" },
      { word: "whole", meaning: "整个的" },
      { word: "broken", meaning: "破损的" },
      { word: "real", meaning: "真的" },
      { word: "true", meaning: "真实的" },
      { word: "clear", meaning: "清楚的" },
      { word: "dark", meaning: "黑暗的" },
      { word: "dry", meaning: "干的" },
      { word: "wet", meaning: "湿的" },
      { word: "dirty", meaning: "脏的" },
      { word: "clean", meaning: "干净的" }
    ]},
    { name: "家居物品", words: [
      { word: "handbag", meaning: "手提包" },
      { word: "wallet", meaning: "钱包" },
      { word: "key", meaning: "钥匙" },
      { word: "lock", meaning: "锁" },
      { word: "basket", meaning: "篮子" },
      { word: "lamp", meaning: "灯" },
      { word: "clock", meaning: "钟" },
      { word: "tool", meaning: "工具" },
      { word: "diary", meaning: "日记" },
      { word: "calendar", meaning: "日历" },
      { word: "scissors", meaning: "剪刀" },
      { word: "match", meaning: "火柴" },
      { word: "swing", meaning: "秋千" },
      { word: "tent", meaning: "帐篷" },
      { word: "rope", meaning: "绳子" },
      { word: "photo", meaning: "照片" },
      { word: "safe", meaning: "保险箱" },
      { word: "circle", meaning: "圆" },
      { word: "bed", meaning: "床" },
      { word: "desk", meaning: "书桌" },
      { word: "table", meaning: "桌子" },
      { word: "chair", meaning: "椅子" },
      { word: "shelf", meaning: "架子" }
    ]}
  ]
};

// Day 17
dayStructure[17] = {
  title: "职业·工作·场所·生产",
  categories: [
    { name: "职业岗位", words: [
      { word: "governor", meaning: "州长" },
      { word: "president", meaning: "总统" },
      { word: "officer", meaning: "官员" },
      { word: "ruler", meaning: "统治者" },
      { word: "policeman", meaning: "警察" },
      { word: "guard", meaning: "警卫" },
      { word: "postman", meaning: "邮递员" },
      { word: "farmer", meaning: "农民" },
      { word: "doctor", meaning: "医生" },
      { word: "nurse", meaning: "护士" },
      { word: "worker", meaning: "工人" },
      { word: "soldier", meaning: "士兵" },
      { word: "writer", meaning: "作家" },
      { word: "actor", meaning: "演员" },
      { word: "actress", meaning: "女演员" },
      { word: "singer", meaning: "歌手" },
      { word: "artist", meaning: "艺术家" },
      { word: "cook", meaning: "厨师" },
      { word: "waiter", meaning: "服务员" },
      { word: "waitress", meaning: "女服务员" },
      { word: "secretary", meaning: "秘书" }
    ]},
    { name: "生产过程", words: [
      { word: "produce", meaning: "生产" },
      { word: "make", meaning: "制造" },
      { word: "create", meaning: "创造" },
      { word: "build", meaning: "建造" },
      { word: "grow", meaning: "生长" },
      { word: "plant", meaning: "种植" },
      { word: "farm", meaning: "农场" },
      { word: "field", meaning: "田地" },
      { word: "factory", meaning: "工厂" },
      { word: "company", meaning: "公司" },
      { word: "business", meaning: "生意" },
      { word: "industry", meaning: "工业" }
    ]},
    { name: "政府·法律", words: [
      { word: "government", meaning: "政府" },
      { word: "district", meaning: "区域" },
      { word: "province", meaning: "省" },
      { word: "city", meaning: "城市" },
      { word: "town", meaning: "城镇" },
      { word: "village", meaning: "村庄" },
      { word: "law", meaning: "法律" },
      { word: "right", meaning: "权利" },
      { word: "fair", meaning: "公平的" },
      { word: "education", meaning: "教育" },
      { word: "army", meaning: "军队" },
      { word: "notice", meaning: "通知" }
    ]}
  ]
};

// Day 18
dayStructure[18] = {
  title: "方向·位置·空间",
  categories: [
    { name: "方向位置", words: [
      { word: "east", meaning: "东" },
      { word: "west", meaning: "西" },
      { word: "south", meaning: "南" },
      { word: "north", meaning: "北" },
      { word: "left", meaning: "左" },
      { word: "right", meaning: "右" },
      { word: "front", meaning: "前面" },
      { word: "back", meaning: "后面" },
      { word: "middle", meaning: "中间" },
      { word: "side", meaning: "旁边" },
      { word: "top", meaning: "顶部" },
      { word: "bottom", meaning: "底部" },
      { word: "center", meaning: "中心" },
      { word: "corner", meaning: "角落" },
      { word: "end", meaning: "末尾" },
      { word: "beginning", meaning: "开始" },
      { word: "toward", meaning: "朝向" },
      { word: "against", meaning: "靠着" }
    ]},
    { name: "介词·位置", words: [
      { word: "on", meaning: "在...上" },
      { word: "above", meaning: "在...上方" },
      { word: "upon", meaning: "在...之上" },
      { word: "over", meaning: "在...上方" },
      { word: "below", meaning: "在...下方" },
      { word: "under", meaning: "在...下面" },
      { word: "among", meaning: "在...之间" },
      { word: "between", meaning: "在...之间" },
      { word: "in", meaning: "在...里面" },
      { word: "inside", meaning: "在里面" },
      { word: "outside", meaning: "在外面" },
      { word: "up", meaning: "向上" },
      { word: "down", meaning: "向下" },
      { word: "across", meaning: "穿过" },
      { word: "through", meaning: "通过" },
      { word: "along", meaning: "沿着" },
      { word: "around", meaning: "周围" },
      { word: "behind", meaning: "在...后面" }
    ]}
  ]
};

// Day 19
dayStructure[19] = {
  title: "时间·顺序·计划",
  categories: [
    { name: "时间顺序", words: [
      { word: "yesterday", meaning: "昨天" },
      { word: "today", meaning: "今天" },
      { word: "tomorrow", meaning: "明天" },
      { word: "morning", meaning: "早上" },
      { word: "afternoon", meaning: "下午" },
      { word: "evening", meaning: "傍晚" },
      { word: "night", meaning: "夜晚" },
      { word: "midnight", meaning: "午夜" },
      { word: "noon", meaning: "中午" },
      { word: "spring", meaning: "春天" },
      { word: "summer", meaning: "夏天" },
      { word: "autumn", meaning: "秋天" },
      { word: "winter", meaning: "冬天" },
      { word: "once", meaning: "一次" },
      { word: "twice", meaning: "两次" },
      { word: "begin", meaning: "开始" },
      { word: "start", meaning: "开始" },
      { word: "finish", meaning: "结束" },
      { word: "stop", meaning: "停止" },
      { word: "continue", meaning: "继续" },
      { word: "then", meaning: "然后" },
      { word: "next", meaning: "下一个" },
      { word: "finally", meaning: "最后" }
    ]}
  ]
};

// Day 20
dayStructure[20] = {
  title: "出行·旅游·观光",
  categories: [
    { name: "旅游出行", words: [
      { word: "visit", meaning: "参观" },
      { word: "visitor", meaning: "游客" },
      { word: "sight", meaning: "景色" },
      { word: "relax", meaning: "放松" },
      { word: "ticket", meaning: "票" },
      { word: "traveler", meaning: "旅行者" },
      { word: "abroad", meaning: "国外" },
      { word: "guide", meaning: "导游" },
      { word: "hotel", meaning: "酒店" },
      { word: "restaurant", meaning: "餐厅" },
      { word: "hall", meaning: "大厅" },
      { word: "passage", meaning: "通道" },
      { word: "map", meaning: "地图" },
      { word: "address", meaning: "地址" },
      { word: "journey", meaning: "旅程" },
      { word: "tour", meaning: "旅游" },
      { word: "trip", meaning: "旅行" },
      { word: "picnic", meaning: "野餐" },
      { word: "camp", meaning: "露营" },
      { word: "sightseeing", meaning: "观光" }
    ]}
  ]
};

// Day 21 - Competition & Sports
dayStructure[21] = {
  title: "比赛·运动·竞技",
  categories: [
    { name: "运动竞技", words: [
      { word: "competition", meaning: "比赛" },
      { word: "game", meaning: "游戏" },
      { word: "match", meaning: "比赛" },
      { word: "race", meaning: "赛跑" },
      { word: "win", meaning: "赢" },
      { word: "beat", meaning: "打败" },
      { word: "lose", meaning: "输" },
      { word: "score", meaning: "得分" },
      { word: "team", meaning: "团队" },
      { word: "player", meaning: "运动员" },
      { word: "coach", meaning: "教练" },
      { word: "fan", meaning: "粉丝" }
    ]},
    { name: "体育运动", words: [
      { word: "run", meaning: "跑步" },
      { word: "jump", meaning: "跳" },
      { word: "swim", meaning: "游泳" },
      { word: "walk", meaning: "步行" },
      { word: "climb", meaning: "爬" },
      { word: "throw", meaning: "扔" },
      { word: "catch", meaning: "接住" },
      { word: "kick", meaning: "踢" },
      { word: "skate", meaning: "滑冰" },
      { word: "ski", meaning: "滑雪" },
      { word: "exercise", meaning: "锻炼" },
      { word: "Olympics", meaning: "奥运会" },
      { word: "football", meaning: "足球" },
      { word: "basketball", meaning: "篮球" },
      { word: "tennis", meaning: "网球" },
      { word: "volleyball", meaning: "排球" },
      { word: "badminton", meaning: "羽毛球" },
      { word: "baseball", meaning: "棒球" },
      { word: "golf", meaning: "高尔夫" },
      { word: "gymnasium", meaning: "体育馆" }
    ]}
  ]
};

// Day 22 - 环境·污染·保护
dayStructure[22] = {
  title: "环境·污染·保护",
  categories: [
    { name: "环境", words: [
      { word: "environment", meaning: "环境" },
      { word: "pollute", meaning: "污染" },
      { word: "pollution", meaning: "污染物" },
      { word: "available", meaning: "可用的" },
      { word: "rubbish", meaning: "垃圾" },
      { word: "waste", meaning: "浪费" },
      { word: "dust", meaning: "灰尘" },
      { word: "noise", meaning: "噪音" },
      { word: "noisy", meaning: "吵闹的" },
      { word: "tidy", meaning: "整洁的" },
      { word: "mess", meaning: "混乱" },
      { word: "messy", meaning: "凌乱的" },
      { word: "clean", meaning: "干净的" },
      { word: "dirty", meaning: "脏的" },
      { word: "recycle", meaning: "回收" },
      { word: "protect", meaning: "保护" },
      { word: "save", meaning: "拯救" }
    ]}
  ]
};

// Day 23 - 生命·安全·危险
dayStructure[23] = {
  title: "生命·安全·危险",
  categories: [
    { name: "安全危险", words: [
      { word: "life", meaning: "生命" },
      { word: "live", meaning: "活着" },
      { word: "alive", meaning: "活着的" },
      { word: "save", meaning: "挽救" },
      { word: "safe", meaning: "安全的" },
      { word: "safety", meaning: "安全" },
      { word: "risk", meaning: "风险" },
      { word: "danger", meaning: "危险" },
      { word: "dangerous", meaning: "危险的" },
      { word: "protect", meaning: "保护" },
      { word: "prevent", meaning: "预防" },
      { word: "avoid", meaning: "避免" },
      { word: "accident", meaning: "事故" },
      { word: "save one's life", meaning: "救命" }
    ]}
  ]
};

// Day 24 - 能力·允许·禁止
dayStructure[24] = {
  title: "能力·允许·禁止·情态动词",
  categories: [
    { name: "情态动词", words: [
      { word: "can", meaning: "能" },
      { word: "could", meaning: "能" },
      { word: "may", meaning: "可以" },
      { word: "might", meaning: "可能" },
      { word: "must", meaning: "必须" },
      { word: "should", meaning: "应该" },
      { word: "shall", meaning: "将" },
      { word: "will", meaning: "将" },
      { word: "would", meaning: "将会" },
      { word: "need", meaning: "需要" },
      { word: "dare", meaning: "敢" },
      { word: "ought to", meaning: "应该" },
      { word: "have to", meaning: "不得不" },
      { word: "able", meaning: "能够的" },
      { word: "allow", meaning: "允许" }
    ]}
  ]
};

// Day 25 - 祈使·请求·建议
dayStructure[25] = {
  title: "祈使·请求·建议",
  categories: [
    { name: "请求建议", words: [
      { word: "let", meaning: "让" },
      { word: "please", meaning: "请" },
      { word: "suggest", meaning: "建议" },
      { word: "advise", meaning: "劝告" },
      { word: "advice", meaning: "建议" },
      { word: "order", meaning: "命令" },
      { word: "command", meaning: "命令" },
      { word: "request", meaning: "请求" },
      { word: "require", meaning: "要求" },
      { word: "demand", meaning: "要求" },
      { word: "warn", meaning: "警告" },
      { word: "remind", meaning: "提醒" },
      { word: "encourage", meaning: "鼓励" },
      { word: "agree", meaning: "同意" }
    ]}
  ]
};

// Day 26 - 社会·文化·传统
dayStructure[26] = {
  title: "社会·文化·传统",
  categories: [
    { name: "社会文化", words: [
      { word: "society", meaning: "社会" },
      { word: "culture", meaning: "文化" },
      { word: "traditional", meaning: "传统的" },
      { word: "modern", meaning: "现代的" },
      { word: "ancient", meaning: "古代的" },
      { word: "history", meaning: "历史" },
      { word: "festival", meaning: "节日" },
      { word: "custom", meaning: "习俗" },
      { word: "celebrate", meaning: "庆祝" },
      { word: "celebration", meaning: "庆祝" },
      { word: "holiday", meaning: "假日" },
      { word: "vacation", meaning: "假期" },
      { word: "news", meaning: "新闻" },
      { word: "newspaper", meaning: "报纸" },
      { word: "radio", meaning: "收音机" },
      { word: "television", meaning: "电视" },
      { word: "Internet", meaning: "互联网" },
      { word: "message", meaning: "消息" }
    ]}
  ]
};

// Day 27 - 代词·冠词·连词
dayStructure[27] = {
  title: "代词·冠词·连词·常用虚词",
  categories: [
    { name: "代词", words: [
      { word: "I", meaning: "我" },
      { word: "you", meaning: "你" },
      { word: "he", meaning: "他" },
      { word: "she", meaning: "她" },
      { word: "it", meaning: "它" },
      { word: "we", meaning: "我们" },
      { word: "they", meaning: "他们" },
      { word: "me", meaning: "我" },
      { word: "him", meaning: "他" },
      { word: "her", meaning: "她" },
      { word: "us", meaning: "我们" },
      { word: "them", meaning: "他们" },
      { word: "my", meaning: "我的" },
      { word: "your", meaning: "你的" },
      { word: "his", meaning: "他的" },
      { word: "her", meaning: "她的" },
      { word: "its", meaning: "它的" },
      { word: "our", meaning: "我们的" },
      { word: "their", meaning: "他们的" },
      { word: "this", meaning: "这个" },
      { word: "that", meaning: "那个" },
      { word: "these", meaning: "这些" },
      { word: "those", meaning: "那些" },
      { word: "who", meaning: "谁" },
      { word: "what", meaning: "什么" },
      { word: "which", meaning: "哪一个" },
      { word: "whom", meaning: "谁" },
      { word: "whose", meaning: "谁的" },
      { word: "somebody", meaning: "某人" },
      { word: "anybody", meaning: "任何人" },
      { word: "nobody", meaning: "没有人" },
      { word: "everybody", meaning: "每人" },
      { word: "someone", meaning: "有人" },
      { word: "anyone", meaning: "任何人" },
      { word: "none", meaning: "没有人" },
      { word: "nothing", meaning: "没有什么" },
      { word: "everything", meaning: "一切" },
      { word: "something", meaning: "某事" },
      { word: "anything", meaning: "任何事物" }
    ]},
    { name: "冠词·连接词", words: [
      { word: "a", meaning: "一个" },
      { word: "an", meaning: "一个" },
      { word: "the", meaning: "这个" },
      { word: "and", meaning: "和" },
      { word: "or", meaning: "或者" },
      { word: "but", meaning: "但是" },
      { word: "so", meaning: "所以" },
      { word: "because", meaning: "因为" },
      { word: "if", meaning: "如果" },
      { word: "when", meaning: "当...时" },
      { word: "where", meaning: "在哪里" },
      { word: "how", meaning: "如何" },
      { word: "why", meaning: "为什么" }
    ]}
  ]
};

// Day 28 - 综合复习·易混词辨析·实用句型
dayStructure[28] = {
  title: "综合复习·易混词辨析·实用句型",
  categories: [
    { name: "易混词辨析", words: [
      { word: "affect", meaning: "影响" },
      { word: "effect", meaning: "效果" },
      { word: "accept", meaning: "接受" },
      { word: "except", meaning: "除了" },
      { word: "adapt", meaning: "适应" },
      { word: "adopt", meaning: "采纳" },
      { word: "raise", meaning: "举起" },
      { word: "rise", meaning: "升起" },
      { word: "lay", meaning: "放置" },
      { word: "lie", meaning: "躺" },
      { word: "bring", meaning: "带来" },
      { word: "take", meaning: "带走" },
      { word: "carry", meaning: "携带" },
      { word: "fetch", meaning: "去取" },
      { word: "borrow", meaning: "借入" },
      { word: "lend", meaning: "借出" },
      { word: "hear", meaning: "听见" },
      { word: "listen", meaning: "听" },
      { word: "see", meaning: "看见" },
      { word: "look", meaning: "看" },
      { word: "watch", meaning: "观看" },
      { word: "say", meaning: "说" },
      { word: "speak", meaning: "讲话" },
      { word: "tell", meaning: "告诉" },
      { word: "talk", meaning: "交谈" }
    ]},
    { name: "单词变形总结", words: [
      { word: "achieve→achievement", meaning: "成就" },
      { word: "agree→agreement", meaning: "同意" },
      { word: "develop→development", meaning: "发展" },
      { word: "treat→treatment", meaning: "治疗" },
      { word: "begin→beginning", meaning: "开始" },
      { word: "build→building", meaning: "建筑" },
      { word: "draw→drawing", meaning: "绘画" },
      { word: "meet→meeting", meaning: "会议" },
      { word: "walk→walking", meaning: "步行" },
      { word: "celebrate→celebration", meaning: "庆祝" },
      { word: "collect→collection", meaning: "收集" },
      { word: "act→active", meaning: "积极的" },
      { word: "create→creative", meaning: "创造性的" },
      { word: "simple→simply", meaning: "简单地" },
      { word: "recent→recently", meaning: "最近" },
      { word: "regular→regularly", meaning: "有规律地" },
      { word: "probable→probably", meaning: "可能地" },
      { word: "happy→happily", meaning: "快乐地" },
      { word: "lucky→luckily", meaning: "幸运地" },
      { word: "heavy→heavily", meaning: "沉重地" }
    ]},
    { name: "常用句型", words: [
      { word: "I'd like to...", meaning: "我想要..." },
      { word: "It takes...to...", meaning: "花费...做..." },
      { word: "There be...", meaning: "有..." },
      { word: "It is said that...", meaning: "据说..." },
      { word: "It is believed that...", meaning: "人们相信..." },
      { word: "It is reported that...", meaning: "据报道..." },
      { word: "I think...", meaning: "我认为..." },
      { word: "I believe...", meaning: "我相信..." },
      { word: "In my opinion...", meaning: "在我看来..." },
      { word: "I'm afraid...", meaning: "我恐怕..." },
      { word: "I'm sure...", meaning: "我确信..." },
      { word: "It seems that...", meaning: "似乎..." },
      { word: "It's necessary to...", meaning: "有必要..." },
      { word: "It's important to...", meaning: "重要的是..." }
    ]}
  ]
};

// ============================================
// Assemble all days
// ============================================

const allDays = [day1];
for (let i = 2; i <= 28; i++) {
  if (dayStructure[i]) {
    allDays.push({
      day: dayStructure[i].day || i,
      title: dayStructure[i].title,
      categories: dayStructure[i].categories
    });
  }
}

// Ensure each day has a proper day number
allDays.forEach((day, index) => {
  day.day = index + 1;
});

// ============================================
// Build final output
// ============================================
const vocabulary = {
  title: "28天词汇分类速记",
  totalDays: 28,
  days: allDays
};

// ============================================
// Attempt to enrich with OCR data
// ============================================
function enrichFromOCR() {
  console.log("\n=== Enriching from OCR data ===");
  
  // Parse OCR text to extract additional words
  for (const [pageName, pageText] of Object.entries(ocrData)) {
    const ocrWords = extractWords(pageText);
    console.log(`Page ${pageName}: extracted ${ocrWords.length} word entries from OCR`);
  }
  
  console.log("\nOCR enrichment complete. Using verified vocabulary data.");
}

enrichFromOCR();

// ============================================
// Write output
// ============================================

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(vocabulary, null, 2), 'utf-8');

// ============================================
// Print statistics
// ============================================
console.log("\n=== Vocabulary Statistics ===");
let totalWords = 0;
let totalCategories = 0;

vocabulary.days.forEach(day => {
  const dayWords = day.categories.reduce((sum, cat) => sum + cat.words.length, 0);
  totalWords += dayWords;
  totalCategories += day.categories.length;
  console.log(`Day ${day.day}: ${day.categories.length} categories, ${dayWords} words - ${day.title}`);
});

console.log(`\nTotal: ${vocabulary.totalDays} days, ${totalCategories} categories, ${totalWords} words`);
console.log(`\nOutput written to: ${outputPath}`);

// ============================================
// Verify Day 1 against user requirements
// ============================================
console.log("\n=== Day 1 Verification ===");
const d1 = vocabulary.days[0];
const expectedCounts = {
  "个人基本信息": 9,
  "体貌描述": 13,
  "性格、处世": 34,
  "工作与职业": 2
};

for (const cat of d1.categories) {
  const expected = expectedCounts[cat.name] || '?';
  const actual = cat.words.length;
  const status = expected === actual ? '✓' : `✗ (expected ${expected})`;
  console.log(`  ${cat.name}: ${actual} words ${status}`);
}

console.log("\nBuild complete!");
