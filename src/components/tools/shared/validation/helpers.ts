import type { ValidationMessage } from '../ui/ValidationResult';
import type { ParameterDef } from '../schemas/item-parameters';
import {
  EVENT_NAME_REGEX,
  EVENT_NAME_MAX_LENGTH,
  PARAM_VALUE_MAX_LENGTH,
  ISO_CURRENCIES,
} from './constants';

// ── Event name validation ───────────────────────────────────────────────────

export function validateEventName(name: string): ValidationMessage[] {
  const msgs: ValidationMessage[] = [];

  if (!name) {
    msgs.push({ type: 'warning', message: 'Event name is required.' });
    return msgs;
  }

  if (!EVENT_NAME_REGEX.test(name)) {
    msgs.push({
      type: 'warning',
      message: `Event name "${name}" must be lowercase with underscores (e.g., purchase, add_to_cart). GA4 rejects names with spaces, hyphens, or uppercase letters.`,
    });
  }

  if (name.length > EVENT_NAME_MAX_LENGTH) {
    msgs.push({
      type: 'error',
      message: `Event name "${name}" is ${name.length} characters — GA4 allows a maximum of ${EVENT_NAME_MAX_LENGTH}.`,
    });
  }

  if (msgs.length === 0) {
    msgs.push({ type: 'success', message: 'Event name looks valid.' });
  }

  return msgs;
}

// ── Parameter value validation ──────────────────────────────────────────────

export function validateParamValue(
  value: string,
  paramDef: ParameterDef
): ValidationMessage[] {
  const msgs: ValidationMessage[] = [];
  if (value === '') return msgs;

  // Type checking
  if (paramDef.type === 'number') {
    if (isNaN(parseFloat(value)) || value.trim() === '') {
      msgs.push({
        type: 'error',
        message: `${paramDef.displayName} must be a number (e.g., 29.99). Remove quotes if present.`,
      });
      return msgs;
    }
  }

  // String length
  if (paramDef.type === 'string' && value.length > PARAM_VALUE_MAX_LENGTH) {
    msgs.push({
      type: 'warning',
      message: `${paramDef.displayName} is ${value.length} characters — GA4 truncates parameter values at ${PARAM_VALUE_MAX_LENGTH}.`,
    });
  }

  // Pattern validation
  if (paramDef.validation?.pattern) {
    const regex = new RegExp(paramDef.validation.pattern);
    if (!regex.test(value)) {
      // Provide context-specific messages for known patterns
      if (paramDef.name === 'currency' || paramDef.validation.pattern === '^[A-Z]{3}$') {
        if (!ISO_CURRENCIES.has(value)) {
          msgs.push({
            type: 'warning',
            message: `Currency "${value}" is not a recognized ISO 4217 code. Use a 3-letter code like USD, EUR, SEK, or GBP.`,
          });
        }
      } else {
        msgs.push({
          type: 'warning',
          message: `${paramDef.displayName} "${value}" doesn't match the expected format.`,
        });
      }
    }
  }

  // Enum validation
  if (paramDef.validation?.enum && paramDef.validation.enum.length > 0) {
    if (!paramDef.validation.enum.includes(value)) {
      const options = paramDef.validation.enum.slice(0, 4).join(', ');
      msgs.push({
        type: 'warning',
        message: `${paramDef.displayName} "${value}" is not a standard value. Common options: ${options}.`,
      });
    }
  }

  // Min/max for numbers
  if (paramDef.type === 'number' && !isNaN(parseFloat(value))) {
    const num = parseFloat(value);
    if (paramDef.validation?.min !== undefined && num < paramDef.validation.min) {
      msgs.push({
        type: 'warning',
        message: `${paramDef.displayName} should be at least ${paramDef.validation.min}.`,
      });
    }
    if (paramDef.validation?.max !== undefined && num > paramDef.validation.max) {
      msgs.push({
        type: 'warning',
        message: `${paramDef.displayName} should be at most ${paramDef.validation.max}.`,
      });
    }
  }

  return msgs;
}

// ── Enum to SelectField options ─────────────────────────────────────────────

export function enumToOptions(
  values: string[]
): { label: string; value: string }[] {
  return values.map((v) => ({
    label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: v,
  }));
}
