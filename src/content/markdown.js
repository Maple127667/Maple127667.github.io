function markdownBody(path, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${path} 缺少有效的 YAML Frontmatter`);
  }

  return match[2].trim();
}

export function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").trim();
}

export function formatArticleDate(value) {
  return normalizeDate(value).replaceAll("-", ".");
}

export function assertUniqueIds(items, label) {
  const duplicateIds = items
    .map((item) => item.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  if (duplicateIds.length) {
    throw new Error(`${label} id 必须唯一：${[...new Set(duplicateIds)].join(", ")}`);
  }
}

export function createMarkdownBodyLoader(path, bodyModules) {
  const importBody = bodyModules[path];

  if (!importBody) {
    throw new Error(`${path} 缺少正文加载器`);
  }

  let bodyPromise;
  return () => {
    bodyPromise ??= Promise.resolve(importBody())
      .then((source) => {
        if (typeof source !== "string") {
          throw new TypeError(`${path} 正文模块未返回文本`);
        }
        return markdownBody(path, source);
      })
      .catch((error) => {
        bodyPromise = undefined;
        throw error;
      });
    return bodyPromise;
  };
}
