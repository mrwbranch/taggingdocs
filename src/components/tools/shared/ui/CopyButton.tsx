import { useState } from 'react';

interface Props {
  text: string;
}

export function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer"
      style={{
        color: copied ? '#22d3ee' : '#94a3b8',
        borderColor: copied ? 'rgb(6 182 212 / 0.3)' : 'rgb(51 65 85 / 0.7)',
        backgroundColor: copied ? 'rgb(8 51 68 / 0.3)' : 'transparent',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
