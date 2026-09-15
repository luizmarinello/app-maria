import { useState } from 'react';
import { BellRinging, CalendarPlus, Copy, PencilSimple, Plus, Scissors, Trash } from '@phosphor-icons/react';
import { Button, Empty, Field, IconButton, Notice, PageHead, Skeleton } from '../components/ui';
import { calendarLink, listServices, removeService, saveService, useData } from '../lib/db';
import { supabase } from '../lib/supabase';
import { durationLabel } from '../lib/date';
import { money } from '../lib/format';

const vazio = { name: '', duration: '60', price: '' };

export default function Ajustes() {
  const { data, loading, error, reload } = useData(listServices, []);
  const [edit, setEdit] = useState(null);
  const [erro, setErro] = useState(null);
  const [cal, setCal] = useState({ busy: false, link: null, copied: false });

  const abrirCalendario = async () => {
    setCal({ busy: true, link: null, copied: false });
    try {
      const { url, https } = await calendarLink();
      setCal({ busy: false, link: { url, https }, copied: false });
      window.location.href = url; // webcal:// abre o Calendário do iPhone
    } catch (e) {
      setCal({ busy: false, link: null, copied: false });
      setErro(e.message);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(cal.link.https);
      setCal((c) => ({ ...c, copied: true }));
    } catch {
      setErro('Não deu para copiar. Segure no link para copiar manualmente.');
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    const price = Number(String(edit.price).replace(',', '.'));
    const duration = parseInt(edit.duration, 10);
    if (!edit.name.trim()) return setErro('Informe o nome do serviço.');
    if (!Number.isInteger(duration) || duration <= 0) return setErro('Duração inválida, use minutos.');
    if (!Number.isFinite(price) || price < 0) return setErro('Valor inválido.');

    setErro(null);
    try {
      await saveService({
        ...(edit.id ? { id: edit.id } : {}),
        name: edit.name.trim(),
        duration_min: duration,
        price,
      });
      setEdit(null);
      reload();
    } catch (e) {
      setErro(e.message);
    }
  };

  const excluir = async (s) => {
    if (!window.confirm(`Remover "${s.name}" da lista? Os agendamentos antigos mantêm o histórico.`)) return;
    try {
      await removeService(s.id);
      reload();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <main className="screen">
      <PageHead
        title="Ajustes"
        subtitle="Seus serviços, durações e valores"
        action={
          !edit && <IconButton icon={Plus} label="Novo serviço" onClick={() => setEdit({ ...vazio })} />
        }
      />

      {edit && (
        <form className="stack" onSubmit={salvar}>
          <div className="group">
            <Field
              label="Nome"
              placeholder="Ex.: Manutenção"
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
            <Field
              label="Duração em minutos"
              inputMode="numeric"
              value={edit.duration}
              onChange={(e) => setEdit({ ...edit, duration: e.target.value })}
            />
            <Field
              label="Valor"
              inputMode="decimal"
              value={edit.price}
              onChange={(e) => setEdit({ ...edit, price: e.target.value })}
            />
          </div>
          <div className="row">
            <Button type="button" variant="soft" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      )}

      {erro && <Notice>{erro}</Notice>}

      {loading && !data ? (
        <Skeleton rows={4} height={62} />
      ) : error ? (
        <Notice>{error}</Notice>
      ) : data.length === 0 ? (
        <Empty icon={Scissors} title="Nenhum serviço ainda">Toque em + para cadastrar o primeiro.</Empty>
      ) : (
        <div className="group">
          {data.map((s) => (
            <div className="group-row" key={s.id}>
              <span className="grow">
                <b style={{ display: 'block', letterSpacing: '-0.01em' }}>{s.name}</b>
                <span className="t-foot t-num">
                  {durationLabel(s.duration_min)} · {money(s.price)}
                </span>
              </span>
              <IconButton
                icon={PencilSimple}
                variant="soft"
                label={`Editar ${s.name}`}
                onClick={() =>
                  setEdit({ id: s.id, name: s.name, duration: String(s.duration_min), price: String(s.price) })
                }
              />
              <IconButton
                icon={Trash}
                variant="danger"
                label={`Remover ${s.name}`}
                onClick={() => excluir(s)}
              />
            </div>
          ))}
        </div>
      )}

      <section className="stack">
        <p className="group-title">Lembretes</p>
        <div className="group">
          <div className="group-row" style={{ alignItems: 'flex-start' }}>
            <span className="icon-btn soft" style={{ flex: 'none' }}>
              <BellRinging size={20} weight="fill" />
            </span>
            <span className="grow">
              <b style={{ display: 'block', letterSpacing: '-0.01em' }}>Avisos no Calendário do iPhone</b>
              <span className="t-foot">
                Seus atendimentos aparecem no app Calendário, com alerta 30 minutos antes. Adicione uma vez;
                depois atualiza sozinho.
              </span>
            </span>
          </div>
          <button className="group-row link-row" onClick={abrirCalendario} disabled={cal.busy}>
            <CalendarPlus size={20} weight="fill" />
            <span className="grow">{cal.busy ? 'Preparando…' : 'Adicionar ao Calendário'}</span>
          </button>
          {cal.link && (
            <button className="group-row link-row" onClick={copiar}>
              <Copy size={20} />
              <span className="grow">{cal.copied ? 'Link copiado' : 'Copiar link (se não abriu sozinho)'}</span>
            </button>
          )}
        </div>
        {cal.link && (
          <p className="t-foot" style={{ margin: '0 4px' }}>
            Trate esse link como uma senha: quem tiver ele consegue ver a agenda.
          </p>
        )}
      </section>

      <Button variant="soft" onClick={() => supabase.auth.signOut()}>
        Sair da conta
      </Button>
    </main>
  );
}
