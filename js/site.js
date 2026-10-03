// ============================================================
// 站点文案 —— 手动维护的部分都在这里（js/data.js 是脚本生成的）
// ============================================================

const SITE = {
  author: "Shijie Zhou",
  title: "Selected Photographs",
  // 扉页上的一句话
  statement: "Not all those who wander are lost.",
  // 引用的出处（扉页和页脚都会显示）；不是引用就把两个都留空
  statementBy: "J.R.R. Tolkien",
  statementSource: "The Fellowship of the Ring",
  // 个人主页
  home: "https://jerryplain.github.io/",
  footerLinks: [
    { label: "Home", url: "https://jerryplain.github.io/" },
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

// 每个系列的"条目"叫什么（系列标题下方的计数、以及地点行）。没写的默认 place。
// 复数形式见 js/main.js 的 PLURALS。
const SUBJECT = {
  "me": "place",
  "car": "model",
  "robot": "model",
  "concert": "act",
  "school": "scene",
  "company": "site",
};

// 地图上只放这些系列的地方（城市）。Concert 按场次所在城市落点；湖、山等不上图。
const ATLAS_SERIES = ["city", "concert"];

// 扉页照片拖尾不从这些系列里取图（例如仿真渲染，不是照片）。
const TRAIL_SKIP = ["robot"];

// 访客地球（RevolverMaps2）。页面一打开就记一次访问，地球上按城市标出访客、最新访客带国旗。
// 和个人主页用同一个 key，所以统计的是 jerryplain.github.io 整站（主页 + 摄影）的访客。
// id 是 revolvermaps2.com 给的嵌入代码里 data-site 的值；theme 可选 night / dark / blue；
// color 是图钉颜色（不带 #）。id 留空则不显示这一节。
const VISITORS = { id: "a2tgw4xdkrzv", theme: "blue", color: "13dc04" };

