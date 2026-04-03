import React from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date';
  validation?: { pattern?: string; min?: number; max?: number; maxLength?: number };
  error?: string;
  onBlur?: () => void;
}

function validateInput(value: string, validation?: TextFieldProps['validation']): string {
  if (!validation || !value) return '';

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return `Invalid format`;
    }
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return `Maximum ${validation.maxLength} characters`;
  }

  if (validation.min !== undefined && !isNaN(parseFloat(value))) {
    const num = parseFloat(value);
    if (num < validation.min) {
      return `Minimum value is ${validation.min}`;
    }
  }

  if (validation.max !== undefined && !isNaN(parseFloat(value))) {
    const num = parseFloat(value);
    if (num > validation.max) {
      return `Maximum value is ${validation.max}`;
    }
  }

  return '';
}

export function TextField({ label, value, onChange, placeholder, helpText, required, type = 'text', validation, error: externalError, onBlur }: TextFieldProps) {
  const [internalError, setInternalError] = React.useState('');
  const displayError = externalError || internalError;

  const handleBlur = () => {
    const validationError = validateInput(value, validation);
    setInternalError(validationError);
    onBlur?.();
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setInternalError('');
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded-md border text-sm outline-none transition-colors"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.5)',
          borderColor: displayError ? '#f87171' : 'rgb(51 65 85 / 0.7)',
          color: '#e2e8f0',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
        onBlur={(e) => {
          handleBlur();
          if (!displayError) {
            e.target.style.borderColor = 'rgb(51 65 85 / 0.7)';
          }
        }}
      />
      {helpText && (
        <span className="text-xs" style={{ color: '#64748b' }}>{helpText}</span>
      )}
      {displayError && (
        <span className="text-xs" style={{ color: '#fca5a5' }}>{displayError}</span>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string; group?: string }[];
  helpText?: string;
  required?: boolean;
}

export function SelectField({ label, value, onChange, options, helpText, required }: SelectFieldProps) {
  const groups = new Map<string, { label: string; value: string }[]>();
  const ungrouped: { label: string; value: string }[] = [];

  for (const opt of options) {
    if (opt.group) {
      if (!groups.has(opt.group)) groups.set(opt.group, []);
      groups.get(opt.group)!.push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-md border text-sm outline-none cursor-pointer"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.8)',
          borderColor: 'rgb(51 65 85 / 0.7)',
          color: '#e2e8f0',
        }}
      >
        {ungrouped.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        {[...groups.entries()].map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {helpText && (
        <span className="text-xs" style={{ color: '#64748b' }}>{helpText}</span>
      )}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helpText?: string;
}

export function CheckboxField({ label, checked, onChange, helpText }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-cyan-500"
      />
      <div>
        <span className="text-sm" style={{ color: '#e2e8f0' }}>{label}</span>
        {helpText && (
          <span className="block text-xs" style={{ color: '#64748b' }}>{helpText}</span>
        )}
      </div>
    </label>
  );
}
