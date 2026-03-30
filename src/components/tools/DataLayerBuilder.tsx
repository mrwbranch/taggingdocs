import { useState, useCallback } from 'react';
import JSON5 from 'json5';
import { useToolState } from './shared/hooks/useToolState';
import { CodeOutput } from './shared/ui/CodeOutput';
import { TextField, SelectField, CheckboxField } from './shared/ui/FieldBuilder';
import { ValidationResult } from './shared/ui/ValidationResult';
import type { ValidationMessage } from './shared/ui/ValidationResult';
import { ECOMMERCE_EVENTS } from './shared/schemas/ecommerce-events';
import { RECOMMENDED_EVENTS } from './shared/schemas/recommended-events';
import type { EventSchema, ParameterDef } from './shared/schemas/item-parameters';

// ── Types ────────────────────────────────────────────────────────────────────

interface ItemValues {
  [key: string]: string;
}

interface CustomParam {
  key: string;
  value: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALL_EVENTS: EventSchema[] = [...ECOMMERCE_EVENTS, ...RECOMMENDED_EVENTS];

function findSchema(eventName: string): EventSchema | undefined {
  return ALL_EVENTS.find((e) => e.name === eventName);
}

function parseItems(json: string): ItemValues[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [{}];
  } catch {
    return [{}];
  }
}

function parseCustomParams(json: string): CustomParam[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [{ key: '', value: '' }];
  } catch {
    return [{ key: '', value: '' }];
  }
}

function formatValue(val: string, type: 'string' | 'number' | 'boolean'): string {
  if (val === '' || val === undefined) return '';
  if (type === 'number') {
    const n = parseFloat(val);
    return isNaN(n) ? `'${val}'` : String(n);
  }
  if (type === 'boolean') {
    return val === 'true' ? 'true' : 'false';
  }
  return `'${val}'`;
}

function buildObjectLiteral(
  entries: [string, string][],
  paramDefs: ParameterDef[],
  indent: string
): string {
  const defMap = new Map(paramDefs.map((p) => [p.name, p]));
  const lines: string[] = [];
  for (const [key, val] of entries) {
    if (val === '') continue;
    const def = defMap.get(key);
    const type = def ? def.type : guessType(val);
    lines.push(`${indent}  ${key}: ${formatValue(val, type)}`);
  }
  if (lines.length === 0) return '{}';
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

function guessType(val: string): 'string' | 'number' | 'boolean' {
  if (val === 'true' || val === 'false') return 'boolean';
  if (!isNaN(parseFloat(val)) && val.trim() !== '') return 'number';
  return 'string';
}

function generateCode(opts: {
  eventName: string;
  schema: EventSchema | undefined;
  paramValues: Record<string, string>;
  items: ItemValues[];
  ecommerceClearing: boolean;
  includeUserData: boolean;
  isCustom: boolean;
  customEventName: string;
  customParams: CustomParam[];
}): string {
  const {
    eventName,
    schema,
    paramValues,
    items,
    ecommerceClearing,
    includeUserData,
    isCustom,
    customEventName,
    customParams,
  } = opts;

  const lines: string[] = [];

  if (isCustom) {
    // Custom event
    const resolvedName = customEventName || 'custom_event';
    const paramLines: string[] = [];
    for (const { key, value } of customParams) {
      if (!key) continue;
      paramLines.push(`  ${key}: ${formatValue(value, guessType(value))}`);
    }
    lines.push('dataLayer.push({');
    lines.push(`  event: '${resolvedName}'`);
    if (paramLines.length > 0) {
      lines[lines.length - 1] += ',';
      lines.push(paramLines.join(',\n'));
    }
    lines.push('});');

    if (includeUserData) {
      lines.push('');
      lines.push('// Enhanced Conversions — user_data');
      lines.push('dataLayer.push({');
      lines.push(`  event: '${resolvedName}',`);
      lines.push('  user_data: {');
      lines.push("    email: 'user@example.com'");
      lines.push('  }');
      lines.push('});');
    }

    return lines.join('\n');
  }

  if (!schema) {
    return `dataLayer.push({\n  event: '${eventName}'\n});`;
  }

  if (schema.isEcommerce) {
    if (ecommerceClearing) {
      lines.push('// Clear previous ecommerce data');
      lines.push('dataLayer.push({ ecommerce: null });');
      lines.push('');
    }

    // Top-level params (outside ecommerce object for some events — all go inside ecommerce for GA4)
    const ecomParamLines: string[] = [];
    for (const param of schema.parameters) {
      const val = paramValues[param.name] ?? '';
      if (val === '') continue;
      ecomParamLines.push(`    ${param.name}: ${formatValue(val, param.type)}`);
    }

    // Items
    const itemLines: string[] = [];
    if (schema.hasItems && items.length > 0) {
      for (const item of items) {
        const allItemParams = schema.itemParameters ?? [];
        const defMap = new Map(allItemParams.map((p) => [p.name, p]));
        const fieldLines: string[] = [];
        for (const [key, val] of Object.entries(item)) {
          if (val === '') continue;
          const def = defMap.get(key);
          const type = def ? def.type : guessType(val);
          fieldLines.push(`        ${key}: ${formatValue(val, type)}`);
        }
        if (fieldLines.length > 0) {
          itemLines.push(`      {\n${fieldLines.join(',\n')}\n      }`);
        }
      }
    }

    lines.push('dataLayer.push({');
    lines.push(`  event: '${eventName}',`);
    lines.push('  ecommerce: {');
    if (ecomParamLines.length > 0) {
      lines.push(ecomParamLines.join(',\n') + (itemLines.length > 0 ? ',' : ''));
    }
    if (schema.hasItems) {
      if (itemLines.length > 0) {
        lines.push('    items: [');
        lines.push(itemLines.join(',\n'));
        lines.push('    ]');
      } else {
        lines.push('    items: []');
      }
    }
    lines.push('  }');
    lines.push('});');

    if (includeUserData) {
      lines.push('');
      lines.push('// Enhanced Conversions — user_data');
      lines.push('// Add user_data alongside ecommerce in the same push, or separately');
    }
  } else {
    // Engagement / non-ecommerce
    const paramLines: string[] = [];
    for (const param of schema.parameters) {
      const val = paramValues[param.name] ?? '';
      if (val === '') continue;
      paramLines.push(`  ${param.name}: ${formatValue(val, param.type)}`);
    }

    lines.push('dataLayer.push({');
    lines.push(`  event: '${eventName}'` + (paramLines.length > 0 ? ',' : ''));
    if (paramLines.length > 0) {
      lines.push(paramLines.join(',\n'));
    }
    lines.push('});');

    if (includeUserData) {
      lines.push('');
      lines.push('// Enhanced Conversions — user_data');
      lines.push('dataLayer.push({');
      lines.push("  event: 'user_data',");
      lines.push('  user_data: {');
      lines.push("    email: 'user@example.com'");
      lines.push('  }');
      lines.push('});');
    }
  }

  return lines.join('\n');
}

// ── ISO 4217 common currencies ───────────────────────────────────────────────
const ISO_CURRENCIES = new Set([
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT',
  'BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD',
  'CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD',
  'EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ',
  'GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD',
  'JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP',
  'LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR',
  'MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB',
  'PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD',
  'SCR','SDG','SEK','SGD','SHP','SLL','SOS','SRD','STN','SVC','SYP','SZL','THB',
  'TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS',
  'VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL',
]);

// ── Validation ────────────────────────────────────────────────────────────────

function validateDataLayer(raw: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  if (!raw.trim()) {
    messages.push({ type: 'info', message: 'Paste a dataLayer.push() call to validate.' });
    return messages;
  }

  // Parse
  let stripped = raw.trim();
  // Strip dataLayer.push( ... );
  const pushMatch = stripped.match(/^dataLayer\.push\s*\(([\s\S]*)\)\s*;?\s*$/);
  if (pushMatch) {
    stripped = pushMatch[1].trim();
  }

  let obj: Record<string, unknown>;
  try {
    obj = JSON5.parse(stripped);
  } catch (err) {
    messages.push({ type: 'error', message: `Syntax error: ${(err as Error).message}` });
    return messages;
  }

  messages.push({ type: 'success', message: 'Syntax is valid JSON5.' });

  // Event name check
  const event = obj.event;
  if (!event) {
    messages.push({ type: 'error', message: 'Missing required field: event' });
  } else if (typeof event !== 'string') {
    messages.push({ type: 'error', message: 'event must be a string.' });
  } else {
    if (!/^[a-z][a-z0-9_]*$/.test(event)) {
      messages.push({ type: 'warning', message: `Event name "${event}" should be snake_case (lowercase letters, numbers, underscores, starting with a letter).` });
    }
    if (event.length > 40) {
      messages.push({ type: 'error', message: `Event name "${event}" exceeds 40 characters (${event.length}).` });
    } else {
      messages.push({ type: 'success', message: `Event name "${event}" looks valid.` });
    }
  }

  // Detect if ecommerce event
  const schema = typeof event === 'string' ? findSchema(event) : undefined;
  const ecommerceObj = obj.ecommerce as Record<string, unknown> | null | undefined;

  if (schema?.isEcommerce) {
    if (obj.ecommerce === null) {
      messages.push({ type: 'info', message: 'This appears to be an ecommerce clearing push ({ ecommerce: null }).' });
      return messages;
    }
    if (!ecommerceObj || typeof ecommerceObj !== 'object') {
      messages.push({ type: 'error', message: 'Ecommerce event is missing the "ecommerce" object.' });
    } else {
      messages.push({ type: 'success', message: 'Ecommerce object is present.' });

      // Required params
      for (const param of schema.parameters) {
        if (param.required) {
          if (ecommerceObj[param.name] === undefined || ecommerceObj[param.name] === '') {
            messages.push({ type: 'error', message: `Required ecommerce field missing: ${param.name}` });
          }
        }
      }

      // Currency check
      const currency = ecommerceObj.currency;
      if (currency !== undefined) {
        if (typeof currency !== 'string' || !ISO_CURRENCIES.has(currency as string)) {
          messages.push({ type: 'warning', message: `Currency "${currency}" may not be a valid ISO 4217 code.` });
        } else {
          messages.push({ type: 'success', message: `Currency "${currency}" is a valid ISO 4217 code.` });
        }
      }

      // Value type check
      const value = ecommerceObj.value;
      if (value !== undefined) {
        if (typeof value === 'string') {
          messages.push({ type: 'error', message: `"value" should be a number, not a string. Found: "${value}"` });
        }
      }

      // Items array
      const items = ecommerceObj.items;
      if (schema.hasItems) {
        if (!Array.isArray(items)) {
          messages.push({ type: 'error', message: 'ecommerce.items must be an array.' });
        } else if (items.length === 0) {
          messages.push({ type: 'warning', message: 'ecommerce.items is empty.' });
        } else {
          messages.push({ type: 'success', message: `ecommerce.items contains ${items.length} item(s).` });

          const seenIds = new Set<string>();
          for (let i = 0; i < items.length; i++) {
            const item = items[i] as Record<string, unknown>;
            const itemLabel = `Item[${i}]`;

            if (!item.item_id && !item.item_name) {
              messages.push({ type: 'error', message: `${itemLabel}: must have at least item_id or item_name.` });
            }

            if (item.item_id) {
              const id = String(item.item_id);
              if (seenIds.has(id)) {
                messages.push({ type: 'warning', message: `${itemLabel}: duplicate item_id "${id}" detected.` });
              }
              seenIds.add(id);
            }

            if (item.price !== undefined && typeof item.price === 'string') {
              messages.push({ type: 'error', message: `${itemLabel}: "price" should be a number, not a string.` });
            }
            if (item.quantity !== undefined && typeof item.quantity === 'string') {
              messages.push({ type: 'error', message: `${itemLabel}: "quantity" should be a number, not a string.` });
            }
          }
        }
      }
    }
  } else if (schema) {
    // Non-ecommerce schema — check required fields at top level
    for (const param of schema.parameters) {
      if (param.required) {
        if (obj[param.name] === undefined || obj[param.name] === '') {
          messages.push({ type: 'error', message: `Required field missing: ${param.name}` });
        }
      }
    }
  } else if (typeof event === 'string' && event) {
    messages.push({ type: 'info', message: `"${event}" is not a standard GA4 event — treating as custom event.` });
  }

  // PII detection
  const rawStr = stripped;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  if (emailPattern.test(rawStr)) {
    messages.push({ type: 'warning', message: 'Potential PII detected: email address pattern found. Do not push real user emails to the dataLayer unless using Enhanced Conversions hashing.' });
  }
  if (phonePattern.test(rawStr)) {
    messages.push({ type: 'warning', message: 'Potential PII detected: phone number pattern found. Ensure compliance with your privacy policy.' });
  }

  return messages;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ItemEditorProps {
  index: number;
  values: ItemValues;
  paramDefs: ParameterDef[];
  onChange: (index: number, values: ItemValues) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function ItemEditor({ index, values, paramDefs, onChange, onRemove, canRemove }: ItemEditorProps) {
  const requiredParams = paramDefs.filter((p) => p.required);
  const optionalParams = paramDefs.filter((p) => !p.required);

  return (
    <div
      className="rounded-md border p-3"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(15 23 42 / 0.3)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
          Item {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: '#f87171', backgroundColor: 'rgb(127 29 29 / 0.2)', border: '1px solid rgb(239 68 68 / 0.3)' }}
          >
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {requiredParams.map((param) => (
          <TextField
            key={param.name}
            label={param.displayName}
            value={values[param.name] ?? ''}
            onChange={(v) => onChange(index, { ...values, [param.name]: v })}
            placeholder={param.placeholder}
            helpText={param.description}
            required={param.required}
            type={param.type === 'number' ? 'number' : 'text'}
          />
        ))}
        {optionalParams.map((param) => (
          <TextField
            key={param.name}
            label={param.displayName}
            value={values[param.name] ?? ''}
            onChange={(v) => onChange(index, { ...values, [param.name]: v })}
            placeholder={param.placeholder}
            helpText={param.description}
            type={param.type === 'number' ? 'number' : 'text'}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TOOL_FIELDS = [
  { name: 'mode', defaultValue: 'build' },
  { name: 'event', defaultValue: 'purchase' },
  { name: 'ecommerce_clearing', defaultValue: 'true' },
  { name: 'user_data', defaultValue: 'false' },
  { name: 'items_json', defaultValue: JSON.stringify([{ item_id: '', item_name: '', price: '', quantity: '1' }]) },
  { name: 'custom_event_name', defaultValue: '' },
  { name: 'custom_params_json', defaultValue: JSON.stringify([{ key: '', value: '' }]) },
  { name: 'validate_input', defaultValue: '' },
  // Dynamic param values stored as a JSON blob keyed by param name
  { name: 'param_values_json', defaultValue: '{}' },
];

export default function DataLayerBuilder() {
  const { values, setValue } = useToolState('datalayer-builder', TOOL_FIELDS);

  const mode = values.mode;
  const selectedEvent = values.event;
  const ecommerceClearing = values.ecommerce_clearing === 'true';
  const includeUserData = values.user_data === 'true';
  const customEventName = values.custom_event_name;
  const validateInput = values.validate_input;

  const isCustom = selectedEvent === '__custom__';
  const schema = isCustom ? undefined : findSchema(selectedEvent);

  // Parse complex state from JSON strings
  const items = parseItems(values.items_json);
  const customParams = parseCustomParams(values.custom_params_json);
  const paramValues: Record<string, string> = (() => {
    try {
      return JSON.parse(values.param_values_json) || {};
    } catch {
      return {};
    }
  })();

  // ── Items handlers ──────────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (index: number, newValues: ItemValues) => {
      const updated = [...items];
      updated[index] = newValues;
      setValue('items_json', JSON.stringify(updated));
    },
    [items, setValue]
  );

  const handleAddItem = useCallback(() => {
    setValue('items_json', JSON.stringify([...items, { item_id: '', item_name: '', price: '', quantity: '1' }]));
  }, [items, setValue]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      setValue('items_json', JSON.stringify(updated.length > 0 ? updated : [{}]));
    },
    [items, setValue]
  );

  // ── Custom params handlers ──────────────────────────────────────────────────

  const handleCustomParamChange = useCallback(
    (index: number, field: 'key' | 'value', val: string) => {
      const updated = [...customParams];
      updated[index] = { ...updated[index], [field]: val };
      setValue('custom_params_json', JSON.stringify(updated));
    },
    [customParams, setValue]
  );

  const handleAddCustomParam = useCallback(() => {
    setValue('custom_params_json', JSON.stringify([...customParams, { key: '', value: '' }]));
  }, [customParams, setValue]);

  const handleRemoveCustomParam = useCallback(
    (index: number) => {
      const updated = customParams.filter((_, i) => i !== index);
      setValue('custom_params_json', JSON.stringify(updated.length > 0 ? updated : [{ key: '', value: '' }]));
    },
    [customParams, setValue]
  );

  // ── Param value handler ─────────────────────────────────────────────────────

  const handleParamChange = useCallback(
    (name: string, val: string) => {
      const updated = { ...paramValues, [name]: val };
      setValue('param_values_json', JSON.stringify(updated));
    },
    [paramValues, setValue]
  );

  // ── Event change ────────────────────────────────────────────────────────────

  const handleEventChange = useCallback(
    (eventName: string) => {
      setValue('event', eventName);
      // Reset param values when event changes
      setValue('param_values_json', '{}');
      // Reset items to a clean default
      setValue('items_json', JSON.stringify([{ item_id: '', item_name: '', price: '', quantity: '1' }]));
    },
    [setValue]
  );

  // ── Build event options ─────────────────────────────────────────────────────

  const eventOptions = [
    ...ECOMMERCE_EVENTS.map((e) => ({ label: e.name, value: e.name, group: 'Ecommerce Events' })),
    ...RECOMMENDED_EVENTS.map((e) => ({ label: e.name, value: e.name, group: 'Engagement Events' })),
    { label: 'Custom Event', value: '__custom__', group: 'Custom' },
  ];

  // ── Code generation ─────────────────────────────────────────────────────────

  const generatedCode = generateCode({
    eventName: selectedEvent,
    schema,
    paramValues,
    items,
    ecommerceClearing,
    includeUserData,
    isCustom,
    customEventName,
    customParams,
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);

  const handleValidate = useCallback(() => {
    setValidationMessages(validateDataLayer(validateInput));
  }, [validateInput]);

  // ── Inline build-mode validation ────────────────────────────────────────────

  const buildValidationMessages = useCallback((): ValidationMessage[] => {
    const msgs: ValidationMessage[] = [];
    if (isCustom) {
      if (!customEventName) {
        msgs.push({ type: 'warning', message: 'Custom event name is required.' });
      } else if (!/^[a-z][a-z0-9_]*$/.test(customEventName)) {
        msgs.push({ type: 'warning', message: 'Event name should be snake_case.' });
      } else if (customEventName.length > 40) {
        msgs.push({ type: 'error', message: `Event name exceeds 40 characters (${customEventName.length}).` });
      } else {
        msgs.push({ type: 'success', message: 'Event name looks valid.' });
      }
    } else if (schema) {
      const missingRequired = schema.parameters
        .filter((p) => p.required && !paramValues[p.name])
        .map((p) => p.displayName);
      if (missingRequired.length > 0) {
        msgs.push({ type: 'warning', message: `Missing required fields: ${missingRequired.join(', ')}` });
      } else if (schema.parameters.some((p) => p.required)) {
        msgs.push({ type: 'success', message: 'All required fields are filled.' });
      }

      const currencyParam = schema.parameters.find((p) => p.name === 'currency');
      if (currencyParam && paramValues.currency) {
        if (!ISO_CURRENCIES.has(paramValues.currency)) {
          msgs.push({ type: 'warning', message: `Currency "${paramValues.currency}" may not be a valid ISO 4217 code.` });
        }
      }

      if (schema.hasItems) {
        const hasValidItem = items.some((item) => item.item_id || item.item_name);
        if (!hasValidItem) {
          msgs.push({ type: 'warning', message: 'Add at least one item with an item_id or item_name.' });
        }
      }
    }
    return msgs;
  }, [isCustom, customEventName, schema, paramValues, items]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const containerStyle = {
    borderColor: 'rgb(51 65 85 / 0.7)',
    backgroundColor: 'rgb(15 23 42 / 0.5)',
  } as React.CSSProperties;

  const sectionStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgb(51 65 85 / 0.7)',
    backgroundColor: 'rgb(30 41 59 / 0.3)',
  } as React.CSSProperties;

  const headingColor = '#67e8f9';

  return (
    <div className="my-6 rounded-lg border overflow-hidden" style={containerStyle}>
      {/* Tab bar */}
      <div
        className="flex"
        style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(30 41 59 / 0.3)' }}
      >
        {(['build', 'validate'] as const).map((tab) => {
          const active = mode === tab;
          return (
            <button
              key={tab}
              onClick={() => setValue('mode', tab)}
              className="px-5 py-3 text-sm font-medium capitalize transition-colors"
              style={{
                color: active ? '#67e8f9' : '#94a3b8',
                borderBottom: active ? '2px solid #67e8f9' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab === 'build' ? 'Build' : 'Validate'}
            </button>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {mode === 'build' && (
          <>
            {/* Event selection */}
            <div style={sectionStyle}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: headingColor }}>
                Event Type
              </h3>
              <SelectField
                label="Select Event"
                value={selectedEvent}
                onChange={handleEventChange}
                options={eventOptions}
                required
              />
              {schema && (
                <p className="mt-2 text-xs" style={{ color: '#64748b' }}>
                  {schema.description}
                </p>
              )}
            </div>

            {/* Options */}
            <div style={sectionStyle}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: headingColor }}>
                Options
              </h3>
              <div className="flex flex-col gap-2">
                {schema?.isEcommerce && (
                  <CheckboxField
                    label="Include ecommerce clearing"
                    checked={ecommerceClearing}
                    onChange={(v) => setValue('ecommerce_clearing', String(v))}
                    helpText="Adds dataLayer.push({ ecommerce: null }) before the event push to prevent data merging."
                  />
                )}
                <CheckboxField
                  label="Include user_data for Enhanced Conversions"
                  checked={includeUserData}
                  onChange={(v) => setValue('user_data', String(v))}
                  helpText="Adds a user_data comment/snippet for Google Ads Enhanced Conversions."
                />
              </div>
            </div>

            {/* Custom event */}
            {isCustom && (
              <div style={sectionStyle}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: headingColor }}>
                  Custom Event
                </h3>
                <div className="flex flex-col gap-3">
                  <TextField
                    label="Event Name"
                    value={customEventName}
                    onChange={(v) => setValue('custom_event_name', v)}
                    placeholder="my_custom_event"
                    helpText="snake_case, max 40 characters."
                    required
                  />
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#e2e8f0' }}>
                      Parameters
                    </p>
                    <div className="flex flex-col gap-2">
                      {customParams.map((cp, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={cp.key}
                              onChange={(e) => handleCustomParamChange(i, 'key', e.target.value)}
                              placeholder="parameter_name"
                              className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                              style={{
                                backgroundColor: 'rgb(15 23 42 / 0.5)',
                                borderColor: 'rgb(51 65 85 / 0.7)',
                                color: '#e2e8f0',
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={cp.value}
                              onChange={(e) => handleCustomParamChange(i, 'value', e.target.value)}
                              placeholder="value"
                              className="w-full px-3 py-2 rounded-md border text-sm outline-none"
                              style={{
                                backgroundColor: 'rgb(15 23 42 / 0.5)',
                                borderColor: 'rgb(51 65 85 / 0.7)',
                                color: '#e2e8f0',
                              }}
                            />
                          </div>
                          {customParams.length > 1 && (
                            <button
                              onClick={() => handleRemoveCustomParam(i)}
                              className="px-2 py-2 rounded text-xs"
                              style={{ color: '#f87171', backgroundColor: 'rgb(127 29 29 / 0.2)', border: '1px solid rgb(239 68 68 / 0.3)', whiteSpace: 'nowrap' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddCustomParam}
                        className="self-start px-3 py-1.5 rounded text-xs font-medium"
                        style={{ color: '#67e8f9', backgroundColor: 'rgb(8 145 178 / 0.1)', border: '1px solid rgb(8 145 178 / 0.3)' }}
                      >
                        + Add Parameter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Event parameters */}
            {!isCustom && schema && schema.parameters.length > 0 && (
              <div style={sectionStyle}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: headingColor }}>
                  Event Parameters
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {schema.parameters.map((param) => (
                    <TextField
                      key={param.name}
                      label={param.displayName}
                      value={paramValues[param.name] ?? ''}
                      onChange={(v) => handleParamChange(param.name, v)}
                      placeholder={param.placeholder}
                      helpText={param.description}
                      required={param.required}
                      type={param.type === 'number' ? 'number' : 'text'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Items array builder */}
            {!isCustom && schema?.hasItems && (
              <div style={sectionStyle}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: headingColor }}>
                    Items
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ color: '#67e8f9', backgroundColor: 'rgb(8 145 178 / 0.1)', border: '1px solid rgb(8 145 178 / 0.3)' }}
                  >
                    + Add Item
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((item, i) => (
                    <ItemEditor
                      key={i}
                      index={i}
                      values={item}
                      paramDefs={schema.itemParameters ?? []}
                      onChange={handleItemChange}
                      onRemove={handleRemoveItem}
                      canRemove={items.length > 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inline validation */}
            <div style={sectionStyle}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: headingColor }}>
                Field Status
              </h3>
              <ValidationResult messages={buildValidationMessages()} />
            </div>

            {/* Generated code */}
            <CodeOutput code={generatedCode} language="javascript" title="Generated dataLayer.push()" />
          </>
        )}

        {mode === 'validate' && (
          <>
            <div style={sectionStyle}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: headingColor }}>
                Paste dataLayer.push() Code
              </h3>
              <textarea
                value={validateInput}
                onChange={(e) => setValue('validate_input', e.target.value)}
                placeholder={`dataLayer.push({\n  event: 'purchase',\n  ecommerce: {\n    transaction_id: 'T-12345',\n    value: 59.99,\n    currency: 'USD',\n    items: [{ item_id: 'SKU-1', item_name: 'Blue T-Shirt', price: 29.99, quantity: 2 }]\n  }\n});`}
                rows={12}
                className="w-full px-3 py-2 rounded-md border text-sm outline-none font-mono leading-relaxed"
                style={{
                  backgroundColor: 'rgb(15 23 42 / 0.5)',
                  borderColor: 'rgb(51 65 85 / 0.7)',
                  color: '#e2e8f0',
                  resize: 'vertical',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
                onBlur={(e) => (e.target.style.borderColor = 'rgb(51 65 85 / 0.7)')}
              />
              <div className="mt-3">
                <button
                  onClick={handleValidate}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'rgb(8 145 178 / 0.2)', color: '#67e8f9', border: '1px solid rgb(8 145 178 / 0.4)' }}
                >
                  Validate
                </button>
              </div>
            </div>

            {validationMessages.length > 0 && (
              <div style={sectionStyle}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: headingColor }}>
                  Validation Results
                </h3>
                <ValidationResult messages={validationMessages} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
