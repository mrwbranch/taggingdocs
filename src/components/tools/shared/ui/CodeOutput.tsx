import { CopyButton } from './CopyButton';

interface Props {
  code: string;
  language: 'javascript' | 'sql' | 'typescript';
  title?: string;
}

function highlightCode(code: string, language: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const isJS = language === 'javascript' || language === 'typescript';
  const isSQL = language === 'sql';

  // Single-pass tokenization prevents nested span corruption.
  // Each branch in the combined regex captures into its own group —
  // once a token is matched (e.g., a comment), text inside it won't
  // be re-processed by other patterns.
  const commentPat = isSQL ? '(--.*$)' : '(\\/\\/.*$)';
  const stringPat = "('(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\")";
  const numberPat = '(\\b\\d+\\.?\\d*\\b)';

  let keywordPat = '';
  if (isJS) {
    keywordPat = '(\\b(?:const|let|var|function|return|if|else|true|false|null|undefined|interface|type|export|import|from)\\b)';
  } else if (isSQL) {
    keywordPat = '(\\b(?:SELECT|FROM|WHERE|AND|OR|GROUP|BY|ORDER|ASC|DESC|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|COUNT|SUM|AVG|MIN|MAX|DISTINCT|LIMIT|OFFSET|HAVING|UNION|ALL|IN|NOT|NULL|IS|BETWEEN|LIKE|CASE|WHEN|THEN|ELSE|END|WITH|UNNEST|CROSS|SAFE_CAST|SAFE_DIVIDE|APPROX_COUNT_DISTINCT|TIMESTAMP_MICROS|TIMESTAMP_DIFF|PARSE_DATE|FORMAT_DATE|DATE|INT64|STRING|FLOAT64|STRUCT|ARRAY|PARTITION|OVER|ROW_NUMBER|LEAD|LAG|FIRST_VALUE|LAST_VALUE|COUNTIF|IFNULL|COALESCE|ROUND|CONCAT|CAST|ARRAY_AGG|STRING_AGG|FULL|USING)\\b)';
  }

  const parts = [commentPat, stringPat];
  if (keywordPat) parts.push(keywordPat);
  parts.push(numberPat);

  const combined = new RegExp(parts.join('|'), 'gm' + (isSQL ? 'i' : ''));

  return escaped.replace(combined, (...args) => {
    // Groups are positional: 1=comment, 2=string, 3=keyword (if present), last=number
    if (args[1]) return `<span style="color:#6272a4">${args[1]}</span>`;
    if (args[2]) return `<span style="color:#f1fa8c">${args[2]}</span>`;
    if (keywordPat && args[3]) return `<span style="color:#ff79c6">${args[3]}</span>`;
    const numIdx = keywordPat ? 4 : 3;
    if (args[numIdx]) return `<span style="color:#bd93f9">${args[numIdx]}</span>`;
    return args[0];
  });
}

export function CodeOutput({ code, language, title }: Props) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)' }}
    >
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          borderBottom: '1px solid rgb(51 65 85 / 0.7)',
          backgroundColor: 'rgb(30 41 59 / 0.5)',
        }}
      >
        <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
          {title || (language === 'sql' ? 'Generated SQL' : 'Generated Code')}
        </span>
        <CopyButton text={code} />
      </div>
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed m-0"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.5)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  );
}
