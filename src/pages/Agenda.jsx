import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretRight, Plus } from '@phosphor-icons/react';
import Calendar from '../components/Calendar';
import { Empty, IconButton, Metric, Notice, PageHead, Skeleton } from '../components/ui';
import { counters, listAppointments, useData } from '../lib/db';
import { dayKey, durationLabel, endOfMonth, hhmm, longDate, startOfMonth } from '../lib/date';
import { money } from '../lib/format';

export default function Agenda() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const stats = useData(counters, []);
  const mes = useData(() => listAppointments(startOfMonth(month), endOfMonth(month)), [month.getTime()]);

  const items = mes.data ?? [];
  const marked = new Set(items.map((a) => dayKey(new Date(a.starts_at))));
  const selKey = dayKey(selected);
  const ofDay = items.filter((a) => dayKey(new Date(a.starts_at)) === selKey);

  return (
    <main className="screen">
      <PageHead
        title="Sua agenda"
        action={
          <IconButton
            icon={Plus}
            label="Novo agendamento"
            onClick={() => navigate(`/agendamento/novo?data=${selKey}`)}
          />
        }
      />

      <div className="metrics">
        <Metric value={stats.data?.hoje ?? '–'} label="Hoje" />
        <Metric value={stats.data?.concluidos ?? '–'} label="Concluídos" tone="good" />
        <Metric value={stats.data?.semana ?? '–'} label="Esta semana" />
      </div>

      <Calendar
        month={month}
        selected={selected}
        marked={marked}
        onSelect={setSelected}
        onMonthChange={(m) => {
          setMonth(m);
          setSelected(m);
        }}
      />

      <section className="stack">
        <h2 className="t-title">{longDate(selected)}</h2>

        {mes.loading && !mes.data ? (
          <Skeleton rows={2} />
        ) : mes.error ? (
          <Notice>{mes.error}</Notice>
        ) : ofDay.length === 0 ? (
          <Empty title="Dia livre">Toque em + para marcar um atendimento.</Empty>
        ) : (
          ofDay.map((a, i) => (
            <Appointment
              key={a.id}
              a={a}
              index={i}
              onClick={() => navigate(`/agendamento/${a.id}`)}
            />
          ))
        )}
      </section>
    </main>
  );
}

function Appointment({ a, index, onClick }) {
  const done = a.status === 'concluido';
  const when = new Date(a.starts_at);

  return (
    <button className="group enter" style={{ '--i': index }} onClick={onClick}>
      <div className="group-row">
        <span className="avatar">{a.client_name?.[0]?.toUpperCase()}</span>
        <span className="grow">
          <b style={{ display: 'block', letterSpacing: '-0.01em' }}>{a.client_name}</b>
          <span className="t-foot">
            {hhmm(when)} · {durationLabel(a.duration_min)} · {a.service_name}
          </span>
        </span>
        <CaretRight size={16} color="var(--text-3)" />
      </div>
      <div className="group-row">
        <span className={`tag ${done ? 'done' : 'todo'}`}>{done ? 'Concluído' : 'Agendado'}</span>
        <b className="grow t-num" style={{ textAlign: 'right', letterSpacing: '-0.01em' }}>
          {money(a.price)}
        </b>
      </div>
    </button>
  );
}
