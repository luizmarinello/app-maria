import { useNavigate } from 'react-router-dom';

export function PageHead({ title, subtitle, action }) {
  return (
    <header className="page-head">
      <div className="grow">
        <h1 className="t-large">{title}</h1>
        {subtitle && <p className="t-foot">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Barra fixa das telas modais: cancelar à esquerda, ação primária à direita. */
export function NavBar({ title, confirmLabel, onConfirm, confirmDisabled }) {
  const navigate = useNavigate();
  return (
    <div className="navbar">
      <button type="button" onClick={() => navigate(-1)}>
        Cancelar
      </button>
      <span className="title">{title}</span>
      <button type={onConfirm ? 'button' : 'submit'} onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </button>
    </div>
  );
}

export function Metric({ value, label, tone, money }) {
  return (
    <div className={`metric${money ? ' money' : ''}`}>
      <b style={tone ? { color: `var(--${tone})` } : undefined}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function Button({ children, icon: IconCmp, variant = '', ...rest }) {
  return (
    <button className={`btn ${variant}`} {...rest}>
      {IconCmp && <IconCmp size={19} weight="bold" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: IconCmp, label, variant = '', ...rest }) {
  return (
    <button className={`icon-btn ${variant}`} aria-label={label} title={label} {...rest}>
      <IconCmp size={20} />
    </button>
  );
}

export function Field({ label, textarea, error, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? <textarea rows={3} {...rest} /> : <input {...rest} />}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="group">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pills({ options, value, onChange }) {
  return (
    <div className="pills">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="pill"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Esqueleto no formato do conteúdo final, em vez de spinner. */
export function Skeleton({ rows = 3, height = 76 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      {title && <b>{title}</b>}
      {children}
    </div>
  );
}

export const Notice = ({ children, tone = 'error' }) => <p className={`notice ${tone}`}>{children}</p>;
