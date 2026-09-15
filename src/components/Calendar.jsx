import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { WEEKDAYS, dayKey, monthGrid, monthLabel, startOfMonth } from '../lib/date';

/**
 * Recolhido mostra só a semana do dia selecionado (padrão), expandido mostra o mês.
 * As setas andam uma semana ou um mês conforme o modo.
 */
export default function Calendar({ month, selected, marked, expanded, onToggle, onSelect, onMonthChange }) {
  const grid = monthGrid(month);
  const selKey = dayKey(selected);
  const todayKey = dayKey(new Date());

  const weekIndex = Math.max(0, grid.findIndex((d) => dayKey(d) === selKey));
  const days = expanded ? grid : grid.slice(weekIndex - (weekIndex % 7), weekIndex - (weekIndex % 7) + 7);

  const step = (n) => {
    if (expanded) {
      const m = new Date(month.getFullYear(), month.getMonth() + n, 1);
      onMonthChange(m);
      onSelect(m);
      return;
    }
    const d = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 7 * n);
    onSelect(d);
    if (d.getMonth() !== month.getMonth()) onMonthChange(startOfMonth(d));
  };

  const pick = (d) => {
    onSelect(d);
    if (d.getMonth() !== month.getMonth()) onMonthChange(startOfMonth(d));
  };

  return (
    <div className="card cal">
      <div className="cal-head">
        <button className="cal-title" onClick={onToggle} aria-expanded={expanded}>
          {monthLabel(month)}
          <CaretDown size={14} weight="bold" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
        </button>
        <button className="icon-btn plain" onClick={() => step(-1)} aria-label={expanded ? 'Mês anterior' : 'Semana anterior'}>
          <CaretLeft size={18} weight="bold" />
        </button>
        <button className="icon-btn plain" onClick={() => step(1)} aria-label={expanded ? 'Próximo mês' : 'Próxima semana'}>
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
            expanded && d.getMonth() !== month.getMonth() ? 'outside' : '',
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
              onClick={() => pick(d)}
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
