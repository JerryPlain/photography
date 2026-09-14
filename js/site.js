// ============================================================
// 站点文案 —— 手动维护的部分都在这里（js/data.js 是脚本生成的）
// ============================================================

const SITE = {
  author: "Shijie Zhou",
  title: "Selected Photographs",
  // 扉页上的一句话
  statement: "A record of places passed through, and the light that stayed.",
  // 个人主页
  home: "https://jerryplain.github.io/",
  footerLinks: [
    { label: "About", url: "https://jerryplain.github.io/" },
    { label: "Publications", url: "https://jerryplain.github.io/publications/" },
    { label: "Email", url: "mailto:jerryplain@outlook.com" },
  ],
  copyright: "© 2026 Shijie Zhou · All photographs by the author.",
};

// 每个系列一句话。key 是文件夹名生成的 slug（见 js/data.js）。
// 没写的系列不显示副标题。
const TAGLINES = {
  "city": "Streets, skylines, and the pace of elsewhere.",
  "me": "The one behind the camera.",
  "sea-and-lake": "Water, horizon, and the long exhale.",
  "mountain": "Higher ground, thinner air.",
  "car": "Machines that were designed to be looked at.",
  "robot": "New bodies, learning to stand.",
  "company": "Where the work happens.",
  "school": "Corridors and courtyards of a few good years.",
  "concert": "Loud rooms, remembered quietly.",
  "architecture": "Structure, shadow, and deliberate form.",
  "church": "Quiet light in sacred spaces.",
  "museum": "Rooms where time is kept.",
  "national-park": "The scale of the land, and the sky above it.",
  "astronomical-phenomena": "What the sky does when we look up.",
  "firework": "Brief, bright, gone.",
  "flower": "Small colors, close.",
  "animal": "Other lives, met briefly.",
  "graduation": "An ending that felt like a beginning.",
  "portrait": "Faces, given a moment.",
};

// 首页每个系列只放几张，其余点进系列才能看到。
// 每次打开首页从整个系列里随机抽，页面停着时还会一张一张悄悄换。
// 想限定只从某些照片里抽，就在 HIGHLIGHTS 里按原始文件名（不带后缀）列出来；留空 = 全部随机。
const HIGHLIGHTS = {};

// 首页每个系列同时展示几张的基数（没写的默认 4）。
// 宽屏自动放大：≥1400px ×1.5，≥1000px ×1.25，手机 ×0.75。
const HOME_COUNT = { "city": 6, "me": 3, "sea-and-lake": 3, "car": 3, "school": 4, "mountain": 2 };
