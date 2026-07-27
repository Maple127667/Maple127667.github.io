---
# id 可省略；省略时自动使用文件名，并成为公开网址的一部分
id: "article-slug"
# order 控制文章排序；数字越小越靠前
order: 5
title: "文章标题"
date: "2026-07-27"
category: "DESIGN / ENGINEERING"
excerpt: "用于首页索引和阅读器头部的文章摘要。"
# 只能有一篇 featured: true；未设置时默认选择排序第一篇
featured: false
---

> 可选的导语。文章阅读器会把开头的引用块显示为大号引言。

正文支持 **粗体**、*强调*、[链接](https://example.com)、列表、图片、表格、引用和代码块。

## 第一个章节标题

所有二级标题都会自动进入左侧目录，无需手动维护章节数据。

### 三级标题

- 列表项目
- 另一个列表项目

```js
console.log("Markdown article");
```

## 第二个章节标题

将此文件复制到 `src/content/articles/`，修改文件名与 Frontmatter 后即可发布到 `/articles/<id>`。
