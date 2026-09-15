import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowClockwise, CheckCircle, Prohibit, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { Button, Field, NavBar, Notice, Pills, Skeleton } from '../components/ui';
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
import { dayKey, durationLabel, endOfDay, hhmm, startOfDay } from '../lib/date';
import { money, whatsapp } from '../lib/format';
import { overlaps } from '../lib/report.mjs';

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
    clientName: '',
    clientId: null,
    serviceId: null,
    serviceName: '',
    date: params.get('data') || dayKey(new Date()),
    time: '09:00',
    duration: 60,
    price: '0',
    status: 'agendado',
  });
  const [form, setForm] = useState(vazio);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    // A mesma tela serve para editar e para "novo" (via Remarcar), então zera antes de carregar.
    setForm(vazio());
    setLoading(true);
    (async () => {
      try {
        const [srv, cli] = await Promise.all([listServices(), listClients()]);
        setServices(srv);
        setClients(cli);

        // Vindo de "Remarcar": cliente, serviço e hora já escolhidos.
        if (!id && params.get('cliente')) {
          const c = cli.find((x) => x.id === params.get('cliente'));
          const sv = srv.find((x) => x.id === params.get('servico'));
          set({
            ...(c ? { clientId: c.id, clientName: c.name } : {}),
            ...(sv ? { serviceId: sv.id, serviceName: sv.name, duration: sv.duration_min, price: String(sv.price) } : {}),
            ...(params.get('hora') ? { time: params.get('hora') } : {}),
          });
        }

        if (id) {
          const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
          if (error) throw new Error(error.message);
          const when = new Date(data.starts_at);
          set({
            clientName: data.client_name,
            clientId: data.client_id,
            serviceId: data.service_id,
            serviceName: data.service_name,
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
  const fim = new Date(inicio.getTime() + form.duration * 60000);
  const conflito = doDia.find((a) => {
    const s = new Date(a.starts_at);
    return overlaps(inicio, fim, s, new Date(s.getTime() + a.duration_min * 60000));
  });

  const clienteAtual = clients.find((c) => c.id === form.clientId);
  const zap = whatsapp(clienteAtual?.phone);

  const pickService = (sid) => {
    const s = services.find((x) => x.id === sid);
    if (!s) return;
    set({ serviceId: s.id, serviceName: s.name, duration: s.duration_min, price: String(s.price) });
  };

  const salvar = async (e) => {
    e.preventDefault();
    const name = form.clientName.trim();
    const price = Number(String(form.price).replace(',', '.'));
    if (!name) return setErro('Informe o nome da cliente.');
    if (!form.serviceId) return setErro('Escolha um serviço.');
    if (!Number.isFinite(price) || price < 0) return setErro('Valor inválido.');
    if (Number.isNaN(inicio.getTime())) return setErro('Data ou hora inválida.');

    setSaving(true);
    setErro(null);
    try {
      let clientId = form.clientId;
      const known = clients.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!clientId && known) clientId = known.id;
      if (!clientId) clientId = (await saveClient({ name })).id;

      await saveAppointment({
        ...(id ? { id } : {}),
        client_id: clientId,
        client_name: name,
        service_id: form.serviceId,
        service_name: form.serviceName,
        starts_at: inicio.toISOString(),
        duration_min: form.duration,
        price,
        status: form.status,
      });
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
      ...(form.serviceId ? { servico: form.serviceId } : {}),
    });
    navigate(`/agendamento/novo?${q}`);
  };

  const excluir = async () => {
    if (!window.confirm('Excluir de vez? Some do histórico e do financeiro. Para só tirar da agenda, use Cancelar atendimento.')) return;
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

  return (
    <form className="screen modal" onSubmit={salvar}>
      <NavBar
        title={id ? 'Agendamento' : 'Novo agendamento'}
        confirmLabel={saving ? 'Salvando' : 'Salvar'}
        confirmDisabled={saving || loading}
      />

      {loading ? (
        <Skeleton rows={2} height={120} />
      ) : (
        <>
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
                <div className="group-row" style={{ flexWrap: 'wrap' }}>
                  <Pills
                    options={sugestoes.map((s) => ({ value: s.id, label: s.name }))}
                    value={form.clientId}
                    onChange={(cid) =>
                      set({ clientId: cid, clientName: sugestoes.find((s) => s.id === cid).name })
                    }
                  />
                </div>
              )}
              {zap && (
                <a className="group-row link-row" href={zap} target="_blank" rel="noreferrer">
                  <WhatsappLogo size={20} weight="fill" />
                  <span className="grow">Chamar {clienteAtual.name} no WhatsApp</span>
                </a>
              )}
            </div>

            <p className="group-title">Serviço</p>
            {services.length === 0 ? (
              <p className="t-foot" style={{ margin: '0 4px' }}>
                Nenhum serviço cadastrado. Vá em Ajustes para criar o primeiro.
              </p>
            ) : (
              <Pills
                options={services.map((s) => ({ value: s.id, label: s.name }))}
                value={form.serviceId}
                onChange={pickService}
              />
            )}
          </section>

          <section className="stack">
            <div className="group">
              <Field label="Data" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
              <Field label="Hora" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
              <Field
                label="Valor"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </div>
            <p className="t-foot" style={{ margin: '0 4px' }}>
              {hhmm(inicio)} às {hhmm(fim)} · {durationLabel(form.duration)} ·{' '}
              {money(String(form.price).replace(',', '.'))}
            </p>

            {conflito && (
              <Notice tone="warn">
                Conflita com {conflito.client_name} às {hhmm(new Date(conflito.starts_at))} (
                {durationLabel(conflito.duration_min)}). Dá para salvar mesmo assim.
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
                    <span className="grow">{a.client_name}</span>
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
                Excluir de vez
              </Button>
            </section>
          )}
        </>
      )}
    </form>
  );
}
