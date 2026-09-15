import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { WEEKDAYS, dayKey, monthGrid, monthLabel } from '../lib/date';

export default function Calendar({ month, selected, marked, onSelect, onMonthChange }) {
  const days = monthGrid(month);
  const selKey = dayKey(selected);
  const todayKey = dayKey(new Date());
  const step = (n) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="card cal">
      <div className="cal-head">
        <b>{monthLabel(month)}</b>
        <button className="icon-btn plain" onClick={() => step(-1)} aria-label="Mês anterior">
          <CaretLeft size={18} weight="bold" />
        </button>
        <button className="icon-btn plain" onClick={() => step(1)} aria-label="Próximo mês">
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="dow">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const k = dayKey(d);
          const cls = [
            'cal-day',
            d.getMonth() !== month.getMonth() ? 'outside' : '',
            k === todayKey ? 'today' : '',
            k === selKey ? 'sel' : '',
            marked.has(k) ? 'marked' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={k}
              className={cls}
              onClick={() => onSelect(d)}
              aria-pressed={k === selKey}
              aria-label={d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}>
              <i>{d.getDate()}</i>
              <u />
            </button>
          );
        })}
      </div>
    </div>
  );
}
