import { useState } from 'react';
import { CaretDown, PencilSimple, Phone, Plus, Trash, UsersThree, WhatsappLogo } from '@phosphor-icons/react';
import { Avatar, Button, Empty, Field, IconButton, Notice, PageHead, Skeleton } from '../components/ui';
import { clientHistory, completedVisits, listClients, removeClient, saveClient, useData } from '../lib/db';
import { hhmm } from '../lib/date';
import { money, tel, whatsapp } from '../lib/format';
import { daysSince, lastVisits } from '../lib/report.mjs';

// Manutenção costuma ser a cada 15 a 21 dias; acima disso vale chamar.
const DIAS_PARA_CHAMAR = 25;

export default function Clientes() {
  const { data, loading, error, reload } = useData(listClients, []);
  const visitas = useData(completedVisits, []);
  const [edit, setEdit] = useState(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(null);
  const [historico, setHistorico] = useState({});
  const [erro, setErro] = useState(null);

  const ultima = lastVisits(visitas.data);

  const salvar = async (e) => {
    e.preventDefault();
    if (!edit.name.trim()) return setErro('Informe o nome.');
    setErro(null);
    try {
      await saveClient({
        ...(edit.id ? { id: edit.id } : {}),
        name: edit.name.trim(),
        phone: edit.phone?.trim() || null,
        notes: edit.notes?.trim() || null,
      });
      setEdit(null);
      reload();
    } catch (e) {
      setErro(e.message);
    }
  };

  const excluir = async (cl) => {
    if (!window.confirm(`Remover ${cl.name}? Os agendamentos ficam no histórico.`)) return;
    try {
      await removeClient(cl.id);
      reload();
    } catch (e) {
      setErro(e.message);
    }
  };

  const toggle = async (cl) => {
    if (aberto === cl.id) return setAberto(null);
    setAberto(cl.id);
    if (!historico[cl.id]) {
      try {
        const rows = await clientHistory(cl.id);
        setHistorico((h) => ({ ...h, [cl.id]: rows }));
      } catch (e) {
        setErro(e.message);
      }
    }
  };

  const lista = (data ?? []).filter((x) => x.name.toLowerCase().includes(busca.toLowerCase()));
  const paraChamar = lista.filter((cl) => ultima[cl.id] && daysSince(ultima[cl.id]) >= DIAS_PARA_CHAMAR);

  return (
    <main className="screen">
      <PageHead
        title="Clientes"
        subtitle={`${data?.length ?? 0} cadastradas`}
        action={
          !edit && (
            <IconButton
              icon={Plus}
              label="Nova cliente"
              onClick={() => setEdit({ name: '', phone: '', notes: '' })}
            />
          )
        }
      />

      {edit ? (
        <form className="stack" onSubmit={salvar}>
          <div className="group">
            <Field label="Nome" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Field
              label="Telefone"
              type="tel"
              placeholder="(11) 98765-4321"
              value={edit.phone ?? ''}
              onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
            />
            <Field
              label="Observações"
              textarea
              placeholder="Alergias, preferências, formato de unha..."
              value={edit.notes ?? ''}
              onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
            />
          </div>
          <div className="row">
            <Button type="button" variant="soft" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      ) : (
        <div className="group">
          <Field
            label="Buscar"
            placeholder="Nome da cliente"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      )}

      {erro && <Notice>{erro}</Notice>}

      {!busca && !edit && paraChamar.length > 0 && (
        <Notice tone="info">
          {paraChamar.length === 1
            ? `${paraChamar[0].name} está há mais de ${DIAS_PARA_CHAMAR} dias sem vir.`
            : `${paraChamar.length} clientes estão há mais de ${DIAS_PARA_CHAMAR} dias sem vir.`}
        </Notice>
      )}

      {loading && !data ? (
        <Skeleton rows={4} height={62} />
      ) : error ? (
        <Notice>{error}</Notice>
      ) : lista.length === 0 ? (
        <Empty icon={UsersThree} title="Nenhuma cliente encontrada">
          {busca ? 'Tente outro nome.' : 'Toque em + para cadastrar a primeira.'}
        </Empty>
      ) : (
        <div className="group">
          {lista.map((cl) => {
            const dias = ultima[cl.id] ? daysSince(ultima[cl.id]) : null;
            const chamar = dias !== null && dias >= DIAS_PARA_CHAMAR;
            const zap = whatsapp(cl.phone);
            const fone = tel(cl.phone);

            return (
              <div key={cl.id}>
                <div className="group-row">
                  <button className="grow row" onClick={() => toggle(cl)} aria-expanded={aberto === cl.id}>
                    <Avatar name={cl.name} />
                    <span className="grow" style={{ textAlign: 'left' }}>
                      <b style={{ display: 'block', letterSpacing: '-0.01em' }}>{cl.name}</b>
                      <span className={`t-foot ${chamar ? 'warn' : ''}`}>
                        {dias === null
                          ? 'Sem atendimento ainda'
                          : dias === 0
                            ? 'Veio hoje'
                            : dias === 1
                              ? 'Veio ontem'
                              : `Última visita há ${dias} dias`}
                      </span>
                    </span>
                    <CaretDown
                      size={16}
                      color="var(--text-3)"
                      style={{
                        transform: aberto === cl.id ? 'rotate(180deg)' : 'none',
                        transition: 'transform 180ms var(--ease-out)',
                      }}
                    />
                  </button>
                </div>

                {aberto === cl.id && (
                  <div className="group-row enter detail">
                    {cl.notes && <p className="t-foot" style={{ margin: '0 0 10px' }}>{cl.notes}</p>}

                    {(zap || fone) && (
                      <div className="row" style={{ marginBottom: 12 }}>
                        {zap && (
                          <a className="btn soft small" href={zap} target="_blank" rel="noreferrer">
                            <WhatsappLogo size={18} weight="fill" /> WhatsApp
                          </a>
                        )}
                        {fone && (
                          <a className="btn soft small" href={fone}>
                            <Phone size={18} weight="fill" /> Ligar
                          </a>
                        )}
                      </div>
                    )}

                    {!historico[cl.id] ? (
                      <Skeleton rows={1} height={18} />
                    ) : historico[cl.id].length === 0 ? (
                      <p className="t-foot" style={{ margin: 0 }}>Sem atendimentos registrados</p>
                    ) : (
                      historico[cl.id].map((a) => {
                        const d = new Date(a.starts_at);
                        return (
                          <div className="row t-foot" key={a.id} style={{ padding: '3px 0' }}>
                            <span className="grow t-num">
                              {d.toLocaleDateString('pt-BR')} {hhmm(d)} · {a.service_name}
                              {a.status === 'cancelado' && ' · cancelado'}
                            </span>
                            <span
                              className="t-num"
                              style={{ color: a.status === 'concluido' ? 'var(--good)' : 'var(--text-3)' }}>
                              {money(a.price)}
                            </span>
                          </div>
                        );
                      })
                    )}

                    <div className="row" style={{ marginTop: 12 }}>
                      <IconButton
                        icon={PencilSimple}
                        variant="soft"
                        label={`Editar ${cl.name}`}
                        onClick={() => setEdit({ id: cl.id, name: cl.name, phone: cl.phone, notes: cl.notes })}
                      />
                      <IconButton
                        icon={Trash}
                        variant="danger"
                        label={`Remover ${cl.name}`}
                        onClick={() => excluir(cl)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
