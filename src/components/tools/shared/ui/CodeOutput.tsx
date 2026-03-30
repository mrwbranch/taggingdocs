import { CopyButton } from './CopyButton';

interface Props {
  code: string;
  language: 'javascript' | 'sql' | 'typescript';
  title?: string;
}

function highlightCode(code: string, language: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(
    /(\/\/.*$)/gm,
    '<span style="color:#6272a4">$1</span>'
  );

  // Strings
  highlighted = highlighted.replace(
    /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g,
    '<span style="color:#f1fa8c">$1</span>'
  );

  // Numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#bd93f9">$1</span>'
  );

  if (language === 'javascript' || language === 'typescript') {
    highlighted = highlighted.replace(
      /\b(const|let|var|function|return|if|else|true|false|null|undefined|interface|type|export|import|from)\b/g,
      '<span style="color:#ff79c6">$1</span>'
    );
  }

  if (language === 'sql') {
    highlighted = highlighted.replace(
      /\b(SELECT|FROM|WHERE|AND|OR|GROUP|BY|ORDER|ASC|DESC|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|COUNT|SUM|AVG|MIN|MAX|DISTINCT|LIMIT|OFFSET|HAVING|UNION|ALL|IN|NOT|NULL|IS|BETWEEN|LIKE|CASE|WHEN|THEN|ELSE|END|WITH|UNNEST|CROSS|SAFE_CAST|APPROX_COUNT_DISTINCT|COUNT_DISTINCT|TIMESTAMP_MICROS|PARSE_DATE|FORMAT_DATE|DATE|INT64|STRING|FLOAT64|STRUCT|ARRAY|PARTITION|OVER|ROW_NUMBER|LEAD|LAG|FIRST_VALUE|LAST_VALUE)\b/gi,
      '<span style="color:#ff79c6">$1</span>'
    );
  }

  return highlighted;
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
