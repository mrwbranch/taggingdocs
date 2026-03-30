import { useState } from 'react';

interface TreeNode {
  question: string;
  options: {
    label: string;
    next?: string;
    result?: string;
    resultDescription?: string;
    resultLink?: string;
  }[];
}

interface Props {
  title: string;
  nodes: Record<string, TreeNode>;
  startNode: string;
}

export default function DecisionTree({ title, nodes, startNode }: Props) {
  const [history, setHistory] = useState<string[]>([startNode]);

  const currentNodeId = history[history.length - 1];
  const currentNode = nodes[currentNodeId];

  const handleSelect = (next?: string) => {
    if (next) {
      setHistory([...history, next]);
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(history.slice(0, -1));
    }
  };

  const handleReset = () => {
    setHistory([startNode]);
  };

  if (!currentNode) return null;

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: '0.5rem',
        border: '1px solid rgb(51 65 85 / 0.7)',
        backgroundColor: 'rgb(15 23 42 / 0.5)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgb(51 65 85 / 0.7)',
          backgroundColor: 'rgb(30 41 59 / 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#67e8f9' }}>{title}</span>
        {history.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleBack}
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleReset}
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 500, color: 'white', margin: '0 0 1rem 0' }}>
          {currentNode.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentNode.options.map((option, i) => {
            if (option.result) {
              return (
                <div
                  key={i}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgb(6 182 212 / 0.3)',
                    backgroundColor: 'rgb(8 51 68 / 0.3)',
                  }}
                >
                  <p style={{ fontWeight: 600, color: '#22d3ee', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
                    {option.label}
                  </p>
                  <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.875rem' }}>{option.result}</p>
                  {option.resultDescription && (
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.8125rem' }}>
                      {option.resultDescription}
                    </p>
                  )}
                  {option.resultLink && (
                    <a
                      href={option.resultLink}
                      style={{ color: '#06b6d4', fontSize: '0.8125rem', marginTop: '0.5rem', display: 'inline-block' }}
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(option.next)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgb(51 65 85 / 0.7)',
                  backgroundColor: 'rgb(30 41 59 / 0.5)',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgb(6 182 212 / 0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgb(51 65 85 / 0.7)')}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
