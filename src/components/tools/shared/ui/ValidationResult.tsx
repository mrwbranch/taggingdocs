export interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface Props {
  messages: ValidationMessage[];
}

const ICONS: Record<string, string> = {
  error: '\u274C',
  warning: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
  success: '\u2705',
};

const COLORS: Record<string, { border: string; bg: string; text: string }> = {
  error: { border: 'rgb(239 68 68 / 0.3)', bg: 'rgb(127 29 29 / 0.2)', text: '#fca5a5' },
  warning: { border: 'rgb(234 179 8 / 0.3)', bg: 'rgb(113 63 18 / 0.2)', text: '#fde047' },
  info: { border: 'rgb(59 130 246 / 0.3)', bg: 'rgb(30 58 138 / 0.2)', text: '#93c5fd' },
  success: { border: 'rgb(34 197 94 / 0.3)', bg: 'rgb(20 83 45 / 0.2)', text: '#86efac' },
};

export function ValidationResult({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {messages.map((msg, i) => {
        const colors = COLORS[msg.type];
        return (
          <div
            key={i}
            className="px-3 py-2 rounded-md border text-sm"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            {ICONS[msg.type]} {msg.message}
          </div>
        );
      })}
    </div>
  );
}
