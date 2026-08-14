import { useId } from 'react';
import type { ReactNode } from 'react';

interface BaseFieldProps {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
  className?: string;
}

export function Field({ label, hint, children, className = '' }: BaseFieldProps) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          className="textarea"
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === '' ? undefined : Number(raw));
          }}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          className="select"
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  hint,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  suffix?: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="slider">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            style={{ '--fill': `${fill}%` } as React.CSSProperties}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <output className="slider__value">
            {value}
            {suffix}
          </output>
        </div>
      )}
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="color-field">
          <input
            id={id}
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'}
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            className="input"
            type="text"
            value={value}
            aria-label={`${label} value`}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}
    </Field>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="switch-field">
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="switch__track" />
        <span>{label}</span>
      </label>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

export function ListField({
  label,
  values,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <TextArea
      label={label}
      hint={hint}
      rows={rows}
      value={values.join('\n')}
      onChange={(text) => onChange(text.split('\n').filter((line) => line.trim().length > 0))}
    />
  );
}

export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="creator-section__head">
      <h2 className="creator-section__title display">{title}</h2>
      <p className="creator-section__desc text-muted">{description}</p>
    </header>
  );
}

export function FieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: number }) {
  return (
    <div className="field-grid" style={{ '--field-cols': columns } as React.CSSProperties}>
      {children}
    </div>
  );
}
