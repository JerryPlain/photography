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

// 首页每个系列只"散落"几张代表作，其余点进系列才能看到。
// 按原始文件名（不带后缀）填写，顺序 = 摆放顺序（第一张最大）。最多 6 张。
// 没写的系列默认取前 4 张。
const HIGHLIGHTS = {
  "city": ["IMG_6694", "50ea2263c183d0c8ebe2234804962ef5", "IMG_4169", "DSCF2147", "DSCF1127", "IMG_1407"],
  "me": ["IMG_2293", "dji_mimo_20241228_143338_20241228143338_1735393355875_photo", "IMG_4342", "IMG_4591"],
  "sea-and-lake": ["DSCF2313", "IMG_5243", "IMG_5278"],
  "car": ["DSCF0864", "DSCF2940", "DSCF0862"],
  "school": ["IMG_8642", "IMG_9131", "IMG_6677", "IMG_7133"],
  "mountain": ["DSCF0768", "DSCF0767", "DSCF0775"],
};

