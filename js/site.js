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

// 首页每个系列只放几张代表作，其余点进系列才能看到。
// HIGHLIGHTS 是每个系列的"候选池"：按原始文件名（不带后缀）填，每次打开首页
// 从池子里随机抽 HOME_COUNT 张，并且每隔几秒会有一张悄悄换成池子里的另一张。
// 没写的系列默认整个系列都是候选。
const HIGHLIGHTS = {
  "city": [
    "IMG_6694", "50ea2263c183d0c8ebe2234804962ef5", "IMG_4169", "DSCF2147", "DSCF1127", "IMG_1407",
    "DSCF2949", "DSCF0624", "IMG_4011", "DSCF1067", "IMG_3593", "DSCF0645", "DSCF2810",
    "IMG_1912", "IMG_5850", "IMG_0345", "DSCF2645", "DSCF0375",
  ],
  "school": ["IMG_8642", "IMG_9131", "IMG_6677", "IMG_7133"],
};

// 首页每个系列同时展示几张（没写的默认 4）
const HOME_COUNT = { "city": 6, "me": 3, "sea-and-lake": 3, "car": 3, "school": 4, "mountain": 3 };
