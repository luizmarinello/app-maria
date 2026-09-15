import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Trash } from '@phosphor-icons/react';
import { Button, Field, NavBar, Notice, Pills, Skeleton } from '../components/ui';
import { supabase } from '../lib/supabase';
import { listClients, listServices, removeAppointment, saveAppointment, saveClient, setStatus } from '../lib/db';
import { dayKey, durationLabel, hhmm } from '../lib/date';
import { money } from '../lib/format';

export default function Agendamento() {
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const [params] = useSearchParams();
  const id = rawId === 'novo' ? null : rawId;

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState(null);

  const [form, setForm] = useState(() => ({
    clientName: '',
    clientId: null,
    serviceId: null,
    serviceName: '',
    date: params.get('data') || dayKey(new Date()),
    time: '09:00',
    duration: 60,
    price: '0',
    status: 'agendado',
  }));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    (async () => {
      try {
        const [srv, cli] = await Promise.all([listServices(), listClients()]);
        setServices(srv);
        setClients(cli);
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
    const when = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(when.getTime())) return setErro('Data ou hora inválida.');

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
        starts_at: when.toISOString(),
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

  const excluir = async () => {
    if (!window.confirm('Excluir este agendamento? Não dá para desfazer.')) return;
    try {
      await removeAppointment(id);
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e.message);
    }
  };

  const concluir = async () => {
    try {
      await setStatus(id, 'concluido');
      set({ status: 'concluido' });
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
            </div>

            <p className="group-title">Serviço</p>
            {services.length === 0 ? (
              <Empty />
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
              {durationLabel(form.duration)} · {money(String(form.price).replace(',', '.'))}
            </p>
          </section>

          {erro && <Notice>{erro}</Notice>}

          {id && (
            <section className="stack">
              {form.status !== 'concluido' && (
                <Button type="button" variant="soft" icon={CheckCircle} onClick={concluir}>
                  Marcar como concluído
                </Button>
              )}
              <Button type="button" variant="danger" icon={Trash} onClick={excluir}>
                Excluir agendamento
              </Button>
            </section>
          )}
        </>
      )}
    </form>
  );
}

const Empty = () => (
  <p className="t-foot" style={{ margin: '0 4px' }}>
    Nenhum serviço cadastrado. Vá em Ajustes para criar o primeiro.
  </p>
);
