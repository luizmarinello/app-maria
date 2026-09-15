import { useState } from 'react';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { Button, Empty, Field, IconButton, Notice, PageHead, Skeleton } from '../components/ui';
import { listServices, removeService, saveService, useData } from '../lib/db';
import { durationLabel } from '../lib/date';
import { money } from '../lib/format';

const vazio = { name: '', duration: '60', price: '' };

export default function Ajustes() {
  const { data, loading, error, reload } = useData(listServices, []);
  const [edit, setEdit] = useState(null);
  const [erro, setErro] = useState(null);

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
        <Empty title="Nenhum serviço ainda">Toque em + para cadastrar o primeiro.</Empty>
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
    </main>
  );
}
