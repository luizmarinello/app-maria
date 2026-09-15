import { useState } from 'react';
import { Empty, Metric, Notice, PageHead, Segmented, Skeleton } from '../components/ui';
import { listAppointments, useData } from '../lib/db';
import { summarize } from '../lib/report.mjs';
import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from '../lib/date';
import { money } from '../lib/format';

const periodos = {
  semana: { label: 'Semana', range: (d) => [startOfWeek(d), endOfWeek(d)] },
  mes: { label: 'Mês', range: (d) => [startOfMonth(d), endOfMonth(d)] },
  ano: { label: 'Ano', range: (d) => [startOfYear(d), endOfYear(d)] },
};

export default function Financeiro() {
  const [periodo, setPeriodo] = useState('mes');
  const { data, loading, error } = useData(() => {
    const [from, to] = periodos[periodo].range(new Date());
    return listAppointments(from, to);
  }, [periodo]);

  const r = summarize(data ?? []);
  const maxDia = Math.max(1, ...r.byDay.map((d) => d.total));

  return (
    <main className="screen">
      <PageHead title="Financeiro" subtitle="Somente atendimentos concluídos" />

      <Segmented
        options={Object.entries(periodos).map(([value, p]) => ({ value, label: p.label }))}
        value={periodo}
        onChange={setPeriodo}
      />

      {loading && !data ? (
        <Skeleton rows={2} height={96} />
      ) : error ? (
        <Notice>{error}</Notice>
      ) : (
        <>
          <div className="metrics two">
            <Metric money value={money(r.total)} label="Faturamento" tone="good" />
            <Metric money value={money(r.ticket)} label="Ticket médio" />
          </div>
          <div className="metrics two">
            <Metric value={r.count} label="Atendimentos" />
            <Metric value={r.services} label="Serviços" />
          </div>
          {r.pendingCount > 0 && (
            <p className="t-foot" style={{ margin: '-8px 4px 0' }}>
              Ainda por vir no período: {money(r.pending)} em {r.pendingCount}{' '}
              {r.pendingCount === 1 ? 'agendamento' : 'agendamentos'}.
            </p>
          )}

          {r.byDay.length === 0 ? (
            <Empty title="Nada concluído no período">
              Marque um atendimento como concluído para ele entrar aqui.
            </Empty>
          ) : (
            <>
              <section className="stack">
                <h2 className="t-title">Por dia</h2>
                <div className="card" style={{ padding: 16 }}>
                  <div className="bars">
                    {r.byDay.map((d, i) => (
                      <div key={d.day} title={`${d.day}: ${money(d.total)}`}>
                        <i
                          style={{
                            height: `${Math.max(3, (d.total / maxDia) * 104)}px`,
                            animationDelay: `${i * 25}ms`,
                          }}
                        />
                        <span>{d.day.slice(8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="stack">
                <h2 className="t-title">Por serviço</h2>
                <div className="group">
                  {r.byService.map((s) => (
                    <div className="group-row" key={s.name}>
                      <span className="grow">
                        <b style={{ display: 'block', letterSpacing: '-0.01em' }}>{s.name}</b>
                        <span className="t-foot">
                          {s.count} {s.count === 1 ? 'atendimento' : 'atendimentos'}
                        </span>
                      </span>
                      <b className="t-num" style={{ letterSpacing: '-0.01em' }}>{money(s.total)}</b>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
