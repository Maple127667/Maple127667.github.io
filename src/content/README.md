# 内容维护指南

这个站点的内容已经从页面组件中拆开。日常更新不需要修改 `App.jsx`。

## 新增文章

1. 复制 `ARTICLE_TEMPLATE.md` 到 `articles/`。
2. 修改文件名、Frontmatter 和正文。
3. 二级标题 `##` 会自动生成详情页目录。
4. 发布后的公开网址为 `/articles/<id>`；未填写 `id` 时使用文件名。

## 新增项目

1. 复制 `PROJECT_TEMPLATE.md` 到 `projects/`。
2. 把封面图放到 `public/assets/projects/`，并填写 `cover`。
3. 修改 Frontmatter 和正文；二级标题同样会自动生成目录。
4. 发布后的公开网址为 `/projects/<id>`；未填写 `id` 时使用文件名。

`order` 数字越小越靠前。首页前两个项目使用大版式，其余项目自动进入项目归档区。

## 修改个人资料与技术栈

编辑 `profile.js`：

- `profile` 维护姓名、角色、首页文案、个人介绍、邮箱和 GitHub。
- `technologyGroups` 维护技术栈分组与技能标签。

## Markdown 支持

文章和项目正文均支持标题、引用、粗体、强调、链接、列表、任务列表、图片、表格和代码块。图片建议放在 `public/assets/`，Markdown 中使用 `/assets/...` 的绝对路径。