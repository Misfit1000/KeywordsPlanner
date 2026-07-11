import sanitizeHtml from 'sanitize-html';

const allowedTags = ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'blockquote', 'pre', 'code', 'hr', 'br', 'a'];

export function sanitizeBlogHtml(value: string) {
  const input = String(value || '').slice(0, 100_000);
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: 'a',
        attribs: {
          href: attributes.href || '',
          ...(attributes.title ? { title: attributes.title } : {}),
          rel: 'noopener noreferrer',
        },
      }),
    },
  }).trim();
}

export function blogTextFromHtml(value: string) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
