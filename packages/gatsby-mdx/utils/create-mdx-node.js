const crypto = require("crypto");
const mdx = require("../utils/mdx");
const extractExports = require("../utils/extract-exports");

module.exports = async ({ id, node, content, getNode }) => {
  let code;
  try {
    code = await mdx(content);
  } catch (e) {
    // add location information of the node to simplify debugging error messages

    // Files have the information assigned to itself, other sources most likely at the parent
    const parent = getNode(node.parent) || {};
    const absolutePath = node.absolutePath || parent.absolutePath;
    const node_locale = node.node_locale || parent.node_locale;
    const contentful_id = node.contentful_id || parent.contentful_id;
    const title = node.title || parent.title;
    const slug = node.slug || parent.slug;

    const mdxLocation = [
      `Gatsby: ${id}`,
      absolutePath && `Path: ${absolutePath}`,
      node_locale && `Locale: ${node_locale}`,
      title && `Title: ${title}`,
      slug && `Slug: ${slug}`,
      contentful_id && `Contentful: ${contentful_id}`
    ]
      .filter(Boolean)
      .join("\n");

    e.message += `\nUnable to parse MDX at \n${mdxLocation}\n\n\n${e.message}`;
    throw e;
  }

  // extract all the exports
  const { frontmatter, ...nodeExports } = extractExports(code);

  const mdxNode = {
    id,
    children: [],
    parent: node.id,
    internal: {
      content: content,
      type: "Mdx"
    }
  };

  mdxNode.frontmatter = {
    title: ``, // always include a title
    ...frontmatter,
    _PARENT: node.id
  };

  mdxNode.excerpt = frontmatter.excerpt;
  mdxNode.exports = nodeExports;
  mdxNode.rawBody = content;

  // Add path to the markdown file path
  if (node.internal.type === `File`) {
    mdxNode.fileAbsolutePath = node.absolutePath;
  }

  mdxNode.internal.contentDigest = crypto
    .createHash(`md5`)
    .update(JSON.stringify(mdxNode))
    .digest(`hex`);

  return mdxNode;
};
