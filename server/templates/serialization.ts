import type Handlebars from 'handlebars';

const asString = (value: unknown): string => (value == null ? '' : String(value));

/** Escapes the contents of a quoted source-code/JSON string, without delimiters. */
export function stringContents(value: unknown, quote = 'double', language = ''): string {
  const text = asString(value);
  if (quote === 'verbatim') return text.replace(/"/g, '""');
  let escaped = JSON.stringify(text)
    .slice(1, -1)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  if (quote === 'single' || quote === 'single-f' || quote === 'template' || quote === 'raw') {
    escaped = escaped.replace(/\\"/g, '"');
    if (quote === 'single' || quote === 'single-f') escaped = escaped.replace(/'/g, "\\'");
    if (quote === 'template') escaped = escaped.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    if (quote === 'raw') return text.replace(/`/g, '` + "`" + `');
  }
  if (['kt', 'kts', 'dart', 'gradle'].includes(language)) escaped = escaped.replace(/\$/g, '\\$');
  if (quote === 'python-f' || quote === 'single-f' || quote === 'csharp-interpolated')
    escaped = escaped.replace(/[{}]/g, '$&$&');
  return escaped;
}

export function registerSerializationHelpers(hb: typeof Handlebars): void {
  const safe = (value: string) => new hb.SafeString(value);
  hb.registerHelper('string', (value: unknown, quote: string, language: string) =>
    safe(stringContents(value, quote, language))
  );
  hb.registerHelper('csv', (value: unknown) => {
    const text = asString(value);
    return safe(/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  });
  hb.registerHelper('properties', (value: unknown) =>
    safe(
      asString(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/^ /, '\\ ')
        .replace(
          /[^\x20-\x7e]/g,
          (char) => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')
        )
    )
  );
  hb.registerHelper('ini', (value: unknown) => {
    const text = asString(value);
    return safe(/^\s|\s$|[\r\n]|^"/.test(text) ? JSON.stringify(text) : text);
  });
  hb.registerHelper('compose', (prefix: unknown, value: unknown) =>
    safe(JSON.stringify(asString(prefix) + asString(value)).replace(/\$/g, '$$$$'))
  );
  hb.registerHelper('robot', (value: unknown) =>
    safe(
      asString(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/ /g, '\\ ')
        .replace(/([$@&])\{/g, '\\$1{')
    )
  );
  hb.registerHelper('comment', (value: unknown) =>
    safe(
      asString(value)
        .replace(/\*\//g, '* /')
        .replace(/[\r\n\u2028\u2029]/g, ' ')
    )
  );
  hb.registerHelper('concat', (...values: unknown[]) => {
    values.pop(); // Handlebars options
    return values.map(asString).join('');
  });
}
