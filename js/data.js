// ============================================================
// 站点配置 —— 所有内容都在这个文件里改，不用碰其他代码
// ============================================================

const SITE = {
  author: "Shijie Zhou",
  subtitle: "Photography",
  // 扉页上的一句话（自己写一句喜欢的）
  statement: "A record of places passed through, and the light that stayed.",
  footerLinks: [
    { label: "Portfolio", url: "https://jerryplain.github.io" },
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "X", url: "https://x.com/" },
  ],
  copyright: "© 2026 · All photographs by the author.",
};

// ============================================================
// 系列与照片
//
// 每张照片一个对象：
//   { file: "文件名.jpg", title: "标题", location: "地点（可留空）" }
//
// 把图片文件放进 photos/ 文件夹，file 填文件名即可。
// file 留空 "" 时显示占位图（方便先搭框架、后补照片）。
// ============================================================

const SERIES = [
  {
    title: "City",
    tagline: "Streets, skylines, and the pace of elsewhere.",
    photos: [
      { file: "", title: "Shanghai", location: "" },
      { file: "", title: "Hong Kong", location: "" },
      { file: "", title: "Munich", location: "" },
      { file: "", title: "Berlin", location: "" },
    ],
  },
  {
    title: "Architecture",
    tagline: "Structure, shadow, and deliberate form.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Church",
    tagline: "Quiet light in sacred spaces.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Museum",
    tagline: "Rooms where time is kept.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "National Park",
    tagline: "The scale of the land, and the sky above it.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Sea & Lake",
    tagline: "Water, horizon, and the long exhale.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Astronomical Phenomena",
    tagline: "The sky, on its rare occasions.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Firework",
    tagline: "Bright, brief, unrepeatable.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Flower",
    tagline: "Small color, close attention.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Animal",
    tagline: "Chance meetings, short and wild.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Car",
    tagline: "Metal that wants to move.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Robot",
    tagline: "Where the work meets the lens.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Company",
    tagline: "Visits to where it gets built.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "School",
    tagline: "Campuses, and the roads through them.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Graduation",
    tagline: "An ending, worn as a beginning.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Portrait",
    tagline: "Faces, given a moment.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
  {
    title: "Me",
    tagline: "The one behind the camera.",
    photos: [
      { file: "", title: "Placeholder", location: "" },
      { file: "", title: "Placeholder", location: "" },
    ],
  },
];
