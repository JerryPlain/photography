// ============================================================
// 精选集 —— 我自己的 Unsplash
// 少而精、可下载、可打赏。照片来自摄影站（js/data.js），这里只挑选。
// ============================================================

const COLLECTION = {
  title: "The Collection",
  lede: "A few dozen photographs I am happy to share. Download them in full, use them in your own work, and credit the light.",

  // 授权：默认 CC BY-NC 4.0 = 个人和非商业用途免费、需署名；商业用途来信询问。
  // 想像 Unsplash 一样允许商用，改成 CC BY 4.0（只需署名）或 CC0（什么都不要求）。
  license: {
    name: "CC BY-NC 4.0",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    short: "Free for personal and non-commercial use, with credit.",
    commercial: "Commercial use? Write to me and we will sort it out.",
  },
  credit: "Photo by Shijie Zhou",
  contact: "jerryplain@outlook.com",

  // 打赏方式：填好哪个显示哪个；全部留空时只显示 “Say thanks” 邮件按钮。
  // url 方式（Ko-fi / Buy Me a Coffee / PayPal.me / Stripe 付款链接）点了直接跳转；
  // qr 方式（微信赞赏码 / 支付宝收款码）把图片放进 collection/assets/ 再填路径，点了弹出二维码。
  support: [
    // { label: "Buy me a coffee", note: "Card · Apple Pay · PayPal", url: "https://ko-fi.com/你的用户名" },
    // { label: "PayPal", note: "Any amount", url: "https://paypal.me/你的用户名" },
    // { label: "WeChat", note: "微信赞赏", qr: "assets/wechat.png" },
    // { label: "Alipay", note: "支付宝", qr: "assets/alipay.png" },
  ],

  // 精选：[原始文件名（不带后缀）, 分类]。顺序就是网格顺序。分类：nature / city / architecture
  topics: { nature: "Nature", city: "Cities", architecture: "Architecture" },
  picks: [
    ["DSCF3449", "nature"], ["IMG_6694", "city"], ["fxn 2024-12-24 164606.269", "architecture"], ["IMG_4169", "city"],
    ["IMG_5334", "nature"], ["IMG_1912", "city"], ["50ea2263c183d0c8ebe2234804962ef5", "architecture"], ["DSCF2147", "city"],
    ["DSCF2365", "nature"], ["StudiTUM Rooftop View", "city"], ["DSCF3253", "nature"], ["C90DA214-D55F-4BDF-881E-E62A54F09957", "city"],
    ["DSCF1067", "nature"], ["DSCF2705", "city"], ["DSCF3418", "nature"], ["IMG_4011", "architecture"],
    ["087EFD15-C984-469E-AF9B-AB662B8EACBC", "nature"], ["DSCF2197", "nature"], ["originalImage_2503077354_livephoto", "city"], ["DSCF3550", "nature"],
    ["IMG_2088", "nature"], ["DSCF1364", "architecture"], ["IMG_4564", "architecture"], ["IMG_9626", "nature"],
    ["DSCF2982", "city"], ["DSCF3767", "nature"], ["IMG_6289", "architecture"], ["DSCF3205", "city"],
    ["DSCF0375", "nature"], ["TUM-Rutsche Upstairs, CIT", "architecture"], ["DSCF1294", "nature"], ["DSCF0645", "architecture"],
    ["IMG_6134", "city"], ["DSCF0767", "nature"], ["DSCF0928", "city"], ["DSCF0624", "nature"],
  ],
};
