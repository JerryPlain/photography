# Photography

个人摄影作品集，纯静态站点（HTML / CSS / JS，无构建步骤），部署在 GitHub Pages。

在线地址：https://jerryplain.github.io/photography/

## 更新照片（一条命令）

照片库在本机 `~/Desktop/photography/`，按系列分文件夹：

```
01-City/Berlin, Germany/DSCF1518.jpg     → 系列 City，标题 Berlin，地点 Germany
04-Car/Porsche 911 GTS/DSCF2940.jpg      → 系列 Car，标题 Porsche 911 GTS
02-Me/IMG_4342.jpeg                      → 系列 Me，无标题（显示 Plate 编号）
```

- 系列文件夹 `NN-Name`：NN 决定顺序，Name 是标题（连字符变空格，and 变 &）。
- 只有有照片的系列会出现在网站上。
- 子文件夹 `地点, 国家` 决定照片标题和地点；直接放在系列文件夹里的照片没有标题。

放好照片后运行：

```sh
python3 scripts/ingest.py      # 压缩到 photos/ 并重新生成 js/data.js
git add -A && git commit -m "Update photos" && git push
```

脚本只依赖 macOS 自带的 `sips`。每张照片生成 2000px 的全图和 1000px 的缩略图，文件名带内容 hash，重复运行是增量的；源库里删掉的照片会被自动清理。

## 文案

作者名、扉页句子、页脚链接、各系列的一句话副标题都在 [js/site.js](js/site.js)。
`LEADS` 可以指定某个系列的开篇大图（默认取第一张横构图）。

`js/data.js` 是脚本生成的，不要手改。

## 本地预览

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000
```

调试参数：`?noreveal` 关闭滚动渐显，`?nohero` 隐藏扉页，`?from=N` 隐藏前 N 个系列，`?theme=dark` 强制深色（截图用）。

## 首页只放代表作

首页每个系列只放几张代表作（瀑布流），点 View all 进入 `#/slug` 系列页才看到全部。代表作在 [js/site.js](js/site.js) 的 `HIGHLIGHTS` 里按原始文件名填，第一张是最大的那张，最多 6 张；没填的系列默认取前 4 张。

## 样式

默认浅色（暖纸色 `#f9f7f4`、红色点缀 `#c0392b`、Georgia 标题、SZ 字标），与个人主页同一套视觉；右上角可切到深色模式，深色下背景是星空。系列页是瀑布流网格，保留原始比例不裁切。
