import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarBlank, CalendarCheck, CaretRight, Check, Coffee, Lock, Plus, Sparkle } from '@phosphor-icons/react';
import Calendar from '../components/Calendar';
import { Avatar, Empty, IconButton, Metric, Notice, PageHead, Skeleton } from '../components/ui';
import { counters, listAppointments, setStatus, useData } from '../lib/db';
import { dayKey, durationLabel, endOfMonth, hhmm, longDate, sameDay, startOfMonth } from '../lib/date';
import { money } from '../lib/format';

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

export default function Agenda() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [expanded, setExpanded] = useState(false);
  const [erro, setErro] = useState(null);

  const stats = useData(counters, []);
  const mes = useData(() => listAppointments(startOfMonth(month), endOfMonth(month)), [month.getTime()]);

  const items = mes.data ?? [];
  const marked = new Set(items.map((a) => dayKey(new Date(a.starts_at))));
  const selKey = dayKey(selected);
  const ofDay = items.filter((a) => dayKey(new Date(a.starts_at)) === selKey);
  const isToday = sameDay(selected, new Date());

  const concluir = async (a) => {
    try {
      await setStatus(a.id, 'concluido');
      mes.reload();
      stats.reload();
    } catch (e) {
      setErro(e.message);
    }
  };

  const voltarHoje = () => {
    const hoje = new Date();
    setSelected(hoje);
    setMonth(startOfMonth(hoje));
  };

  return (
    <main className="screen">
      <PageHead
        eyebrow={saudacao()}
        title="Sua agenda"
        subtitle={longDate(new Date())}
        action={
          <IconButton
            icon={Plus}
            label="Novo agendamento"
            onClick={() => navigate(`/agendamento/novo?data=${selKey}`)}
          />
        }
      />

      <div className="metrics">
        <Metric hero icon={CalendarBlank} value={stats.data?.hoje ?? '–'} label="Hoje" />
        <Metric icon={CalendarCheck} value={stats.data?.concluidos ?? '–'} label="Concluídos" tone="good" />
        <Metric icon={Sparkle} value={stats.data?.semana ?? '–'} label="Esta semana" />
      </div>

      <Calendar
        month={month}
        selected={selected}
        marked={marked}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        onSelect={setSelected}
        onMonthChange={setMonth}
      />

      <section className="stack">
        <div className="row">
          <h2 className="t-title grow">{isToday ? 'Hoje' : longDate(selected)}</h2>
          {!isToday && (
            <button className="link" onClick={voltarHoje}>
              Hoje
            </button>
          )}
          <button
            className="link"
            onClick={() => navigate(`/agendamento/novo?tipo=bloqueio&data=${selKey}`)}
            aria-label="Bloquear horário neste dia">
            <Lock size={18} weight="bold" />
          </button>
        </div>

        {erro && <Notice>{erro}</Notice>}

        {mes.loading && !mes.data ? (
          <Skeleton rows={2} />
        ) : mes.error ? (
          <Notice>{mes.error}</Notice>
        ) : ofDay.length === 0 ? (
          <Empty icon={Coffee} title="Dia livre">Toque em + para marcar um atendimento.</Empty>
        ) : (
          <div className="group">
            {ofDay.map((a, i) => (
              <Appointment
                key={a.id}
                a={a}
                index={i}
                onOpen={() => navigate(`/agendamento/${a.id}`)}
                onDone={() => concluir(a)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Appointment({ a, index, onOpen, onDone }) {
  const done = a.status === 'concluido';
  const when = new Date(a.starts_at);

  if (a.status === 'bloqueio') {
    return (
      <button className="group-row enter appt block" style={{ '--i': index }} onClick={onOpen}>
        <span className="appt-time">
          <b className="t-num">{hhmm(when)}</b>
          <span className="t-foot">{durationLabel(a.duration_min)}</span>
        </span>
        <span className="avatar" style={{ '--av-bg': 'var(--surface-2)', '--av-fg': 'var(--text-3)' }}>
          <Lock size={18} weight="bold" />
        </span>
        <span className="grow appt-main">
          <b>{a.service_name}</b>
          <span className="t-foot">Horário bloqueado</span>
        </span>
        <CaretRight size={16} color="var(--text-3)" />
      </button>
    );
  }

  return (
    <div className={`group-row enter appt ${done ? 'done' : ''}`} style={{ '--i': index }}>
      <button className="appt-time" onClick={onOpen}>
        <b className="t-num">{hhmm(when)}</b>
        <span className="t-foot">{durationLabel(a.duration_min)}</span>
      </button>

      <Avatar name={a.client_name} />
      <button className="grow appt-main" onClick={onOpen}>
        <b>{a.client_name}</b>
        <span className="t-foot">
          {a.service_name} · {money(a.price)}
        </span>
      </button>

      {done ? (
        <span className="tag done">Concluído</span>
      ) : (
        <button className="icon-btn check" onClick={onDone} aria-label={`Concluir ${a.client_name}`}>
          <Check size={18} weight="bold" />
        </button>
      )}
      <CaretRight size={16} color="var(--text-3)" />
    </div>
  );
}
