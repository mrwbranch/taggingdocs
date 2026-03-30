import { useMemo } from 'react';
import { useToolState } from './shared/hooks/useToolState';
import { CodeOutput } from './shared/ui/CodeOutput';
import { TextField, SelectField } from './shared/ui/FieldBuilder';
import { QUERY_TEMPLATES } from './shared/schemas/bigquery-templates';
import type { QueryTemplate } from './shared/schemas/bigquery-templates';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { id: QueryTemplate['category']; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'utility', label: 'Utility' },
];

const QUERY_OPTIONS = QUERY_TEMPLATES.map((t) => ({
  label: t.name,
  value: t.id,
  group: CATEGORIES.find((c) => c.id === t.category)?.label ?? t.category,
}));

const DEFAULT_QUERY_ID = QUERY_TEMPLATES[0].id;

// Global config field definitions for useToolState
const GLOBAL_FIELDS = [
  { name: 'queryId', defaultValue: DEFAULT_QUERY_ID },
  { name: 'dataset', defaultValue: 'your_project.analytics_XXXXXXXXX' },
  { name: 'tableName', defaultValue: 'events_*' },
  { name: 'startDate', defaultValue: '' },
  { name: 'endDate', defaultValue: '' },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '0.5rem',
  borderTop: '1px solid rgb(51 65 85 / 0.5)',
  backgroundColor: 'transparent',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  display: 'block',
  marginBottom: '0.75rem',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BigQueryGenerator() {
  const { values, setValue } = useToolState('bigquery-generator', GLOBAL_FIELDS);

  const selectedTemplate = useMemo(
    () => QUERY_TEMPLATES.find((t) => t.id === values.queryId) ?? QUERY_TEMPLATES[0],
    [values.queryId],
  );

  // Merge global config + query-specific config values (prefixed with "qs_")
  const mergedConfig = useMemo<Record<string, string>>(() => {
    const cfg: Record<string, string> = {
      dataset: values.dataset,
      tableName: values.tableName,
      startDate: values.startDate,
      endDate: values.endDate,
    };
    for (const field of selectedTemplate.config) {
      const stored = values[`qs_${field.name}`];
      cfg[field.name] = stored !== undefined ? stored : (field.defaultValue ?? '');
    }
    return cfg;
  }, [values, selectedTemplate]);

  const generatedSQL = useMemo(
    () => selectedTemplate.generateSQL(mergedConfig),
    [selectedTemplate, mergedConfig],
  );

  function handleQueryChange(newId: string) {
    setValue('queryId', newId);
  }

  function handleQuerySpecificChange(fieldName: string, val: string) {
    setValue(`qs_${fieldName}`, val);
  }

  return (
    <div
      className="my-6 rounded-lg border overflow-hidden not-content"
      style={{
        borderColor: 'rgb(51 65 85 / 0.7)',
        backgroundColor: 'rgb(15 23 42 / 0.5)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)' }}>
        <span className="text-base font-semibold inline-block" style={{ color: '#22d3ee' }}>
          BigQuery Query Generator
        </span>
      </div>

      <div className="p-4 flex flex-col gap-6">

        {/* Query Type Selector */}
        <div style={sectionStyle}>
          <div className="flex flex-col gap-3">
            <SelectField
              label="Query Type"
              value={values.queryId}
              onChange={handleQueryChange}
              options={QUERY_OPTIONS}
            />
            {selectedTemplate.description && (
              <p className="text-sm m-0" style={{ color: '#94a3b8' }}>
                {selectedTemplate.description}
              </p>
            )}
          </div>
        </div>

        {/* Global Config */}
        <div style={sectionStyle}>
          <span style={sectionLabelStyle}>Global Configuration</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Dataset"
              value={values.dataset}
              onChange={(v) => setValue('dataset', v)}
              placeholder="your_project.analytics_XXXXXXXXX"
              helpText="BigQuery project and dataset ID"
            />
            <TextField
              label="Table Name"
              value={values.tableName}
              onChange={(v) => setValue('tableName', v)}
              placeholder="events_*"
              helpText="Table name pattern (use * for date-sharded)"
            />
            <TextField
              label="Start Date"
              value={values.startDate}
              onChange={(v) => setValue('startDate', v)}
              placeholder="YYYY-MM-DD"
              type="date"
              helpText="Inclusive start date for _TABLE_SUFFIX"
            />
            <TextField
              label="End Date"
              value={values.endDate}
              onChange={(v) => setValue('endDate', v)}
              placeholder="YYYY-MM-DD"
              type="date"
              helpText="Inclusive end date for _TABLE_SUFFIX"
            />
          </div>
        </div>

        {/* Query-Specific Config */}
        {selectedTemplate.config.length > 0 && (
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Query Options</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedTemplate.config.map((field) => {
                const storedKey = `qs_${field.name}`;
                const currentValue =
                  values[storedKey] !== undefined
                    ? values[storedKey]
                    : (field.defaultValue ?? '');

                if (field.type === 'select' && field.options) {
                  return (
                    <SelectField
                      key={field.name}
                      label={field.label}
                      value={currentValue}
                      onChange={(v) => handleQuerySpecificChange(field.name, v)}
                      options={field.options}
                      helpText={field.helpText}
                      required={field.required}
                    />
                  );
                }

                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    value={currentValue}
                    onChange={(v) => handleQuerySpecificChange(field.name, v)}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    required={field.required}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Generated SQL */}
        <CodeOutput code={generatedSQL} language="sql" />

        {/* Explanation */}
        {selectedTemplate.explanation && (
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>How this query works</span>
            <p className="text-sm m-0" style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              {selectedTemplate.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
