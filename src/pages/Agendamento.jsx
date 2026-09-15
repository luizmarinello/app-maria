import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowClockwise, CheckCircle, Prohibit, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { Button, Field, NavBar, Notice, Segmented, Skeleton } from '../components/ui';
import { supabase } from '../lib/supabase';
import {
  listAppointments,
  listClients,
  listServices,
  removeAppointment,
  saveAppointment,
  saveClient,
  setStatus,
} from '../lib/db';
import { dayKey, durationLabel, endOfDay, hhmm, longDate, startOfDay } from '../lib/date';
import { money, whatsapp } from '../lib/format';
import { overlaps } from '../lib/report.mjs';

const DURACOES_BLOQUEIO = [30, 60, 90, 120, 240, 480];

export default function Agendamento() {
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const [params] = useSearchParams();
  const id = rawId === 'novo' ? null : rawId;

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [doDia, setDoDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);

  const vazio = () => ({
    tipo: params.get('tipo') === 'bloqueio' ? 'bloqueio' : 'atendimento',
    clientName: '',
    clientId: null,
    items: [], // serviços escolhidos: [{service_id, name, duration_min, price}]
    motivo: '',
    date: params.get('data') || dayKey(new Date()),
    time: params.get('hora') || '09:00',
    duration: 60, // usado no bloqueio; no atendimento vem da soma dos serviços
    price: '0', // editável: a soma dos serviços é só o ponto de partida
    status: 'agendado',
  });
  const [form, setForm] = useState(vazio);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const bloqueio = form.tipo === 'bloqueio';
  const duracao = bloqueio ? form.duration : form.items.reduce((s, it) => s + it.duration_min, 0) || 60;
  const nomeServicos = form.items.map((it) => it.name).join(' + ');

  useEffect(() => {
    // A mesma tela serve para editar e para "novo" (via Remarcar), então zera antes de carregar.
    setForm(vazio());
    setLoading(true);
    (async () => {
      try {
        const [srv, cli] = await Promise.all([listServices(), listClients()]);
        setServices(srv);
        setClients(cli);

        // Vindo de "Remarcar": cliente e serviços já escolhidos.
        if (!id && params.get('cliente')) {
          const c = cli.find((x) => x.id === params.get('cliente'));
          const ids = (params.get('servicos') || '').split(',').filter(Boolean);
          const items = ids.map((sid) => srv.find((x) => x.id === sid)).filter(Boolean).map(toItem);
          set({
            ...(c ? { clientId: c.id, clientName: c.name } : {}),
            items,
            price: String(items.reduce((s, it) => s + Number(it.price), 0)),
          });
        }

        if (id) {
          const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
          if (error) throw new Error(error.message);
          const when = new Date(data.starts_at);
          const items =
            Array.isArray(data.items) && data.items.length
              ? data.items
              : data.service_id
                ? [{ service_id: data.service_id, name: data.service_name, duration_min: data.duration_min, price: data.price }]
                : [];
          set({
            tipo: data.status === 'bloqueio' ? 'bloqueio' : 'atendimento',
            clientName: data.client_name,
            clientId: data.client_id,
            items,
            motivo: data.status === 'bloqueio' ? data.service_name : '',
            date: dayKey(when),
            time: hhmm(when),
            duration: data.duration_min,
            price: String(data.price),
            status: data.status,
          });
        }
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // O que já está marcado no dia escolhido, para ver horário livre e conflito.
  useEffect(() => {
    const d = new Date(`${form.date}T00:00`);
    if (Number.isNaN(d.getTime())) return;
    listAppointments(startOfDay(d), endOfDay(d))
      .then((rows) => setDoDia(rows.filter((a) => a.id !== id)))
      .catch(() => setDoDia([]));
  }, [form.date, id]);

  const inicio = new Date(`${form.date}T${form.time}`);
  const fim = new Date(inicio.getTime() + duracao * 60000);
  const conflito = doDia.find((a) => {
    const s = new Date(a.starts_at);
    return overlaps(inicio, fim, s, new Date(s.getTime() + a.duration_min * 60000));
  });

  const clienteAtual = clients.find((c) => c.id === form.clientId);
  const zap = whatsapp(clienteAtual?.phone);
  const lembrete = zap
    ? `${zap}?text=${encodeURIComponent(
        `Oi, ${form.clientName.split(' ')[0]}! Passando para lembrar do seu horário: ${longDate(inicio).toLowerCase()} às ${hhmm(inicio)}, ${nomeServicos || 'atendimento'}. Até lá! 💅`
      )}`
    : null;

  const toggleService = (s) => {
    const has = form.items.some((it) => it.service_id === s.id);
    const items = has ? form.items.filter((it) => it.service_id !== s.id) : [...form.items, toItem(s)];
    set({ items, price: String(items.reduce((sum, it) => sum + Number(it.price), 0)) });
  };

  const salvar = async (e) => {
    e.preventDefault();
    const price = Number(String(form.price).replace(',', '.'));
    if (Number.isNaN(inicio.getTime())) return setErro('Data ou hora inválida.');

    setSaving(true);
    setErro(null);
    try {
      if (bloqueio) {
        await saveAppointment({
          ...(id ? { id } : {}),
          client_id: null,
          client_name: 'Bloqueio',
          service_id: null,
          service_name: form.motivo.trim() || 'Horário bloqueado',
          items: null,
          starts_at: inicio.toISOString(),
          duration_min: form.duration,
          price: 0,
          status: 'bloqueio',
        });
      } else {
        const name = form.clientName.trim();
        if (!name) throw new Error('Informe o nome da cliente.');
        if (form.items.length === 0) throw new Error('Escolha pelo menos um serviço.');
        if (!Number.isFinite(price) || price < 0) throw new Error('Valor inválido.');

        let clientId = form.clientId;
        const known = clients.find((x) => x.name.toLowerCase() === name.toLowerCase());
        if (!clientId && known) clientId = known.id;
        if (!clientId) clientId = (await saveClient({ name })).id;

        await saveAppointment({
          ...(id ? { id } : {}),
          client_id: clientId,
          client_name: name,
          service_id: form.items[0].service_id,
          service_name: nomeServicos,
          items: form.items,
          starts_at: inicio.toISOString(),
          duration_min: duracao,
          price,
          status: form.status === 'bloqueio' ? 'agendado' : form.status,
        });
      }
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  };

  const mudarStatus = async (status) => {
    try {
      await setStatus(id, status);
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e.message);
    }
  };

  const remarcar = (dias) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + dias);
    const q = new URLSearchParams({
      data: dayKey(d),
      hora: form.time,
      ...(form.clientId ? { cliente: form.clientId } : {}),
      servicos: form.items.map((it) => it.service_id).join(','),
    });
    navigate(`/agendamento/novo?${q}`);
  };

  const excluir = async () => {
    const msg = bloqueio
      ? 'Remover este bloqueio?'
      : 'Excluir de vez? Some do histórico e do financeiro. Para só tirar da agenda, use Cancelar atendimento.';
    if (!window.confirm(msg)) return;
    try {
      await removeAppointment(id);
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e.message);
    }
  };

  const sugestoes =
    form.clientName.length >= 2 && !form.clientId
      ? clients.filter((x) => x.name.toLowerCase().includes(form.clientName.toLowerCase())).slice(0, 4)
      : [];

  const titulo = id ? (bloqueio ? 'Bloqueio' : 'Agendamento') : bloqueio ? 'Bloquear horário' : 'Novo agendamento';

  return (
    <form className="screen modal" onSubmit={salvar}>
      <NavBar title={titulo} confirmLabel={saving ? 'Salvando' : 'Salvar'} confirmDisabled={saving || loading} />

      {loading ? (
        <Skeleton rows={2} height={120} />
      ) : (
        <>
          {!id && (
            <Segmented
              options={[
                { value: 'atendimento', label: 'Atendimento' },
                { value: 'bloqueio', label: 'Bloquear horário' },
              ]}
              value={form.tipo}
              onChange={(tipo) => set({ tipo })}
            />
          )}

          {bloqueio ? (
            <section className="stack">
              <div className="group">
                <Field
                  label="Motivo"
                  placeholder="Almoço, folga, curso, médico..."
                  value={form.motivo}
                  onChange={(e) => set({ motivo: e.target.value })}
                />
              </div>
              <p className="group-title">Duração</p>
              <div className="pills">
                {DURACOES_BLOQUEIO.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="pill"
                    aria-pressed={form.duration === m}
                    onClick={() => set({ duration: m })}>
                    {durationLabel(m)}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="stack">
              <div className="group">
                <Field
                  label="Cliente"
                  placeholder="Nome da cliente"
                  autoComplete="off"
                  value={form.clientName}
                  onChange={(e) => set({ clientName: e.target.value, clientId: null })}
                />
                {sugestoes.length > 0 && (
                  <div className="group-row pills" style={{ flexWrap: 'wrap' }}>
                    {sugestoes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="pill"
                        onClick={() => set({ clientId: s.id, clientName: s.name })}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
                {lembrete && form.status === 'agendado' && (
                  <a className="group-row link-row" href={lembrete} target="_blank" rel="noreferrer">
                    <WhatsappLogo size={20} weight="fill" />
                    <span className="grow">Enviar lembrete pelo WhatsApp</span>
                  </a>
                )}
              </div>

              <p className="group-title">Serviços {form.items.length > 1 && `· ${form.items.length} escolhidos`}</p>
              {services.length === 0 ? (
                <p className="t-foot" style={{ margin: '0 4px' }}>
                  Nenhum serviço cadastrado. Vá em Ajustes para criar o primeiro.
                </p>
              ) : (
                <div className="pills">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="pill"
                      aria-pressed={form.items.some((it) => it.service_id === s.id)}
                      onClick={() => toggleService(s)}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="stack">
            <div className="group">
              <Field label="Data" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
              <Field label="Hora" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
              {!bloqueio && (
                <Field
                  label="Valor"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => set({ price: e.target.value })}
                />
              )}
            </div>
            <p className="t-foot" style={{ margin: '0 4px' }}>
              {hhmm(inicio)} às {hhmm(fim)} · {durationLabel(duracao)}
              {!bloqueio && ` · ${money(String(form.price).replace(',', '.'))}`}
            </p>

            {conflito && (
              <Notice tone="warn">
                {conflito.status === 'bloqueio'
                  ? `Horário bloqueado: ${conflito.service_name} às ${hhmm(new Date(conflito.starts_at))}.`
                  : `Conflita com ${conflito.client_name} às ${hhmm(new Date(conflito.starts_at))} (${durationLabel(conflito.duration_min)}).`}{' '}
                Dá para salvar mesmo assim.
              </Notice>
            )}

            {doDia.length > 0 && (
              <div className="group quiet">
                <p className="group-title" style={{ margin: 0, padding: '10px 16px 0' }}>
                  Já marcado neste dia
                </p>
                {doDia.map((a) => (
                  <div className="group-row" key={a.id} style={{ padding: '10px 16px' }}>
                    <b className="t-num" style={{ width: 48 }}>{hhmm(new Date(a.starts_at))}</b>
                    <span className="grow">{a.status === 'bloqueio' ? a.service_name : a.client_name}</span>
                    <span className="t-foot">{durationLabel(a.duration_min)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {erro && <Notice>{erro}</Notice>}

          {id && (
            <section className="stack">
              {form.status === 'agendado' && (
                <>
                  <Button type="button" variant="soft" icon={CheckCircle} onClick={() => mudarStatus('concluido')}>
                    Marcar como concluído
                  </Button>
                  <Button type="button" variant="quiet" icon={Prohibit} onClick={() => mudarStatus('cancelado')}>
                    Cancelar atendimento
                  </Button>
                </>
              )}
              {form.status === 'concluido' && (
                <div className="group quiet">
                  <p className="group-title" style={{ margin: 0, padding: '12px 16px 0' }}>
                    Remarcar {form.clientName.split(' ')[0]} para daqui a
                  </p>
                  <div className="row" style={{ padding: '10px 16px 14px' }}>
                    {[15, 21, 30].map((d) => (
                      <button key={d} type="button" className="btn soft small" onClick={() => remarcar(d)}>
                        <ArrowClockwise size={16} weight="bold" /> {d} dias
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.status === 'cancelado' && (
                <Button type="button" variant="soft" onClick={() => mudarStatus('agendado')}>
                  Reativar atendimento
                </Button>
              )}
              <Button type="button" variant="danger" icon={Trash} onClick={excluir}>
                {bloqueio ? 'Remover bloqueio' : 'Excluir de vez'}
              </Button>
            </section>
          )}
        </>
      )}
    </form>
  );
}

const toItem = (s) => ({ service_id: s.id, name: s.name, duration_min: s.duration_min, price: Number(s.price) });
