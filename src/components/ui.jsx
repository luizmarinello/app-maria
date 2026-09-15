import { useNavigate } from 'react-router-dom';

export function PageHead({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-head">
      <div className="grow">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
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

export function Metric({ icon: IconCmp, value, label, tone, money, hero }) {
  return (
    <div className={`metric${money ? ' money' : ''}${hero ? ' hero' : ''}`}>
      {IconCmp && (
        <span className={`ico ${tone ?? ''}`}>
          <IconCmp size={18} weight="fill" />
        </span>
      )}
      <div>
        <b style={tone ? { color: `var(--${tone})` } : undefined}>{value}</b>
        <span>{label}</span>
      </div>
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
      <IconCmp size={20} weight={variant ? 'regular' : 'bold'} />
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

/* Cinco tons pastel; o nome decide qual, então a mesma cliente tem sempre a mesma cor. */
const TONES = [
  ['#fbe7ec', '#9b3e5c'], // rosa
  ['#fdebdd', '#a65a2e'], // pêssego
  ['#eee7f8', '#6b4fa0'], // lilás
  ['#e3f4ec', '#2e7a57'], // menta
  ['#e4eef9', '#3b5f9a'], // céu
];
export const toneFor = (name = '') => {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
};

export function Avatar({ name }) {
  const [bg, fg] = toneFor(name);
  return (
    <span className="avatar" style={{ '--av-bg': bg, '--av-fg': fg }}>
      {name?.trim()?.[0]?.toUpperCase() ?? '?'}
    </span>
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

export function Empty({ icon: IconCmp, title, children }) {
  return (
    <div className="empty">
      {IconCmp && (
        <span className="ico">
          <IconCmp size={26} weight="duotone" />
        </span>
      )}
      {title && <b>{title}</b>}
      {children}
    </div>
  );
}

export const Notice = ({ children, tone = 'error' }) => <p className={`notice ${tone}`}>{children}</p>;
