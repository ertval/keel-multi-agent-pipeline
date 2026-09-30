/**
 * Allow-list sanitiser for the claim letter the browser injects.
 *
 * The server template escapes every interpolation, so the letter is inert as
 * served. This is the client-side half: the browser is the layer that actually
 * parses the markup, and it is handed the response body verbatim. Without this
 * the page would execute any `<img onerror>` that ever reached it.
 *
 * Policy: parse into an inert document, keep only the tags the letter template
 * is built from, keep only `class` as an attribute, and drop the content of
 * anything that can execute.
 *
 * `class` survives because the template styles its own rows through it. The
 * `style` attribute survives on nothing: it is not in the allowlist and nothing
 * reads it back. A `<style>` element survives in exactly one place — the parsed
 * `<head>`, which `sanitizeLetterHtml` hoists and re-emits through
 * `serializeStyleSheet`, so the letter keeps its typography. That one function
 * returns "" for an empty sheet, for a body containing `<` or `>` (a
 * parser-confusion attempt, not a stylesheet), and for `@import`, `url(`,
 * `expression(` or `javascript:`.
 *
 * A `<style>` element anywhere else — anywhere in the body — is dropped along
 * with its content, because `DROP_WITH_CONTENT` is consulted before the element
 * is looked at any further. That is deliberate: a body-level sheet could
 * restyle the page around the letter, so it is removed rather than neutralised.
 */

const ALLOWED_TAGS = new Set([
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "small",
  "sup",
  "sub",
  "blockquote",
  "pre",
  "code",
]);

const VOID_TAGS = new Set(["br", "hr", "col"]);

/** Tags whose children are discarded along with the element. */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "noscript",
  "template",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "select",
  "option",
  "textarea",
  "link",
  "meta",
  "base",
  "audio",
  "video",
  "source",
  "track",
  "canvas",
]);

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function serializeStyleSheet(css: string): string {
  if (!css.trim() || /[<>]/.test(css)) return "";
  if (/@import|url\s*\(|expression\s*\(|javascript:/i.test(css)) return "";
  return `<style>${css}</style>`;
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (DROP_WITH_CONTENT.has(tag)) return "";

  const className = element.getAttribute("class");
  const attributes = className ? ` class="${escapeText(className)}"` : "";

  const children = Array.from(element.childNodes).map(serializeNode).join("");

  if (VOID_TAGS.has(tag)) return `<${tag}${attributes} />`;
  if (ALLOWED_TAGS.has(tag)) return `<${tag}${attributes}>${children}</${tag}>`;

  return children;
}

export function sanitizeLetterHtml(html: string): string {
  if (!html) return "";

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const styles = Array.from(parsed.head.querySelectorAll("style"))
    .map((node) => serializeStyleSheet(node.textContent ?? ""))
    .join("");

  return `${styles}${Array.from(parsed.body.childNodes).map(serializeNode).join("")}`;
}
