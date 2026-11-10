// ============================================================
// 精选集 —— 我自己的 Unsplash
// 少而精、可下载、可打赏。照片来自摄影站（js/data.js），这里只挑选。
// ============================================================

const COLLECTION = {
  title: "The Collection",
  lede: "A small set of photographs I am happy to share. Download them in full and use them in your own work.",

  // 授权：默认 CC BY-NC 4.0 = 个人和非商业用途免费、需署名；商业用途来信询问。
  // 想像 Unsplash 一样允许商用，改成 CC BY 4.0（只需署名）或 CC0（什么都不要求）。
  license: {
    name: "CC BY-NC 4.0",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    short: "Free for personal and non-commercial use, with credit.",
    commercial: "Commercial use? Write to me and we will sort it out.",
  },
  contact: "jerryplain@outlook.com",

  // 打赏：只放 PayPal.me。以后想加 Ko-fi、微信或支付宝，照这个格式再加一行（url 或 qr）。
  support: {
    title: "Buy me a coffee",
    text: "If you'd like to buy me a coffee, I'd be truly grateful. Thank you for stopping by.",
    methods: [
      { label: "PayPal", note: "paypal.me/ShijieZhou13", url: "https://paypal.me/ShijieZhou13" },
    ],
  },

  // 精选：[原始文件名（不带后缀）, 分类]。顺序就是网格顺序。分类：nature / city / architecture
  topics: { nature: "Nature", city: "Cities", architecture: "Architecture" },
  // 现在精选由桌面 ~/Desktop/photography/Collection 文件夹决定（ingest 生成 collection/picks.js），
  // 下面这份只在那个文件夹不存在时作为后备。
  // 只有几张时按两张一行排，每行等高；横竖搭配一行最好看（横 + 竖，竖 + 横）。
  picks: [
    ["DSCF3767", "nature"],   // Kleine Scheidegg
    ["DSCF2705", "city"],     // Santorini
    ["DSCF3550", "nature"],   // Mürren
    ["DSCF3418", "nature"],   // Grindelwald
  ],
};
