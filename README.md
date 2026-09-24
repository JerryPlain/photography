# Photography

个人摄影作品集，纯静态站点（HTML / CSS / JS，无构建步骤），部署在 GitHub Pages。

在线地址：https://jerryplain.github.io/photography/

## 更新照片（一条命令）

照片库在本机 `~/Desktop/photography/`，按系列分文件夹：

```
01-City/Berlin, Germany/DSCF1518.jpg      → 标题 Berlin，小字 Germany
08-Concert/Billie Eilish, Tokyo 2025/*    → 标题 Billie Eilish，小字 Tokyo 2025
02-Me/Europe/Croatia.jpg                  → 标题 Croatia，小字 Europe（文件名当标题）
02-Me/Asia/Japan/IMG_7830.jpeg            → 标题 Japan，小字 Asia（嵌套文件夹）
04-Car/Porsche 911 GTS/DSCF2940.jpg       → 标题 Porsche 911 GTS
```

- 系列文件夹 `NN-Name`：NN 决定顺序，Name 是标题（连字符变空格，and 变 &）。
- 只有有照片的系列会出现在网站上。
- 子文件夹 `标题, 副标题` 决定照片标题和小字标注，例如 `Dubrovnik, Croatia`、`Billie Eilish, Tokyo 2025`。
- 子文件夹可以嵌套：最里层那层当标题，上一层当小字，例如 `Asia/Japan/` → 标题 Japan，小字 ASIA。
- **文件名如果是个正经名字**（`Croatia.jpg`），它就成为这张照片的标题，文件夹名退成小字标注。
  相机原始文件名（`DSCF1518`、`IMG_6134`、哈希、日期）会被忽略，仍用文件夹名。
- 每个系列的条目叫什么（places / countries / acts …）在 [js/site.js](js/site.js) 的 `SUBJECT` 里改。

放好照片后运行：

```sh
python3 scripts/ingest.py           # 压缩到 photos/ 并重新生成 js/data.js
# python3 scripts/ingest.py --force # 改了压缩参数后，强制重新生成全部
git add -A && git commit -m "Update photos" && git push
```

脚本只依赖 macOS 自带的 `sips`。每张照片生成最大 2000px 的全图和最大 1000px 的缩略图（**原图更小就保持原尺寸，不放大**），文件名带内容 hash，重复运行是增量的；源库里删掉的照片会被自动清理。

## 文案

作者名、扉页句子、页脚链接、各系列的一句话副标题都在 [js/site.js](js/site.js)。
`LEADS` 可以指定某个系列的开篇大图（默认取第一张横构图）。

`js/data.js` 是脚本生成的，不要手改。

## 本地预览

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000
```

调试参数：`?noreveal` 关闭滚动渐显和所有入场动画，`?nohero` 隐藏扉页，`?from=N` 隐藏前 N 个系列，`?theme=dark` 强制深色（截图用）。

## 首页只放一部分，随机、会动

首页每个系列只放几张（`HOME_COUNT` 基数，宽屏自动 ×1.5，手机 ×0.75），每次打开从整个系列里随机抽，尽量每个地点一张；页面停着时每 4 秒左右有一张在原位换成同方向的另一张（放大淡入），标签页不可见、开着灯箱、鼠标悬停时暂停，系统开了"减少动态效果"则完全静止。点 View all 进 `#/slug` 系列页看全部。
想限定只从某些照片里抽，把原始文件名填进 [js/site.js](js/site.js) 的 `HIGHLIGHTS`；留空就是全部随机。

## 地图

系列之前有一张「Where the light was found」地图：两幅图版（欧洲、东南亚与日本），每个拍过照的地方一个红点，点越大照片越多，滚到那里时红点依次落下并有涟漪；悬停显示该地一张缩略图和张数，点击打开该地全部照片。海岸线来自 [Natural Earth](https://www.naturalearthdata.com/) 50m 陆地数据（公有领域），由 `scripts/build_map.py` 裁剪、简化、投影后写进 `js/map.js`（约 55 KB，不联网）。

**新城市出现时**：浏览器控制台会提示 `atlas: no coordinates for …`，把经纬度加进 `scripts/build_map.py` 的 `PLACES`，再跑：

```sh
curl -sLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
python3 scripts/build_map.py ne_50m_land.geojson
```

Concert 的场次（`Munich 2025`）会按城市落到地图上；Me / Car / Robot / School / Company 不上地图。

每个系列标题下面是按小字标注分组的索引（GERMANY Berlin · Frankfurt …；Concert 则按场次分组）。灯箱里除了标题和位置，还会显示相机、焦段、光圈、快门、ISO 和拍摄月份（从原图 EXIF 读出来，导入时写进 `js/data.js`），底部有一条可点击的胶片条在系列内跳转。

动效：扉页标题逐词升起、数字从 0 数上来、目录悬停时在行尾浮出该系列的一张缩略图、目录逐行进入、卡片按序去模糊浮现、点开灯箱时缩略图会直接放大成大图（View Transitions，不支持的浏览器退化为淡入），浅色模式的背景色晕缓慢漂移。

## 样式

默认浅色（暖纸色 `#f9f7f4`、红色点缀 `#c0392b`、Georgia 标题、SZ 字标），与个人主页同一套视觉；右上角可切到深色模式，深色下背景是星空。系列页是瀑布流网格，保留原始比例不裁切。
