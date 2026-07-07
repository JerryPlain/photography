# Photography

个人摄影作品集，纯静态站点（HTML / CSS / JS，无构建步骤），部署在 GitHub Pages。

在线地址：https://jerryplain.github.io/photography/

## 如何添加照片

1. 把图片文件放进 `photos/` 文件夹（建议长边 2000px 左右的 JPG，控制体积）。
2. 编辑 `js/data.js`，在对应系列的 `photos` 数组里填写：

   ```js
   { file: "city-shanghai.jpg", title: "Shanghai", location: "" }
   ```

   - `file` 留空 `""` 会显示占位图；
   - `location` 可留空，有值时显示为小字地点标注。

3. 系列本身（标题、短句、顺序）也都在 `js/data.js` 里改；页面编号、目录、统计数字自动生成。

## 本地预览

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 站点信息

作者名、一句话简介、页脚链接、版权信息都在 `js/data.js` 顶部的 `SITE` 对象里。
