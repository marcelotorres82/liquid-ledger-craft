import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Receita } from '@/types/finance';
import { setSheetOpenState } from '@/lib/sheetState';

interface IncomeSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    descricao: string;
    valor: number;
    tipo: 'fixa' | 'variavel';
    data_registro: string;
  }) => Promise<void>;
  initialDate: string;
  editing: Receita | null;
}

const INCOME_DRAFT_KEY = 'app-financeiro-income-draft-v1';

function isMobileContext() {
  if (typeof window === 'undefined') return false;
  const byViewport = window.matchMedia('(max-width: 900px)').matches;
  const byAgent = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
  return byViewport || byAgent;
}

const IncomeSheet = ({ open, onClose, onSave, initialDate, editing }: IncomeSheetProps) => {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'fixa' | 'variavel'>('fixa');
  const [dataRegistro, setDataRegistro] = useState(initialDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setDescricao(editing.descricao);
      setValor(String(editing.valor));
      setTipo(editing.tipo);
      setDataRegistro(editing.data_registro);
      setError('');
      return;
    }

    if (isMobileContext() && typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(INCOME_DRAFT_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<{
            descricao: string;
            valor: string;
            tipo: 'fixa' | 'variavel';
            data_registro: string;
          }>;
          setDescricao(parsed.descricao || '');
          setValor(parsed.valor || '');
          setTipo(parsed.tipo === 'variavel' ? 'variavel' : 'fixa');
          setDataRegistro(parsed.data_registro || initialDate);
          setError('');
          return;
        } catch {
          // fallback para defaults
        }
      }
    }

    setDescricao('');
    setValor('');
    setTipo('fixa');
    setDataRegistro(initialDate);
    setError('');
  }, [open, initialDate, editing]);

  useEffect(() => {
    if (!open || editing || !isMobileContext()) return;
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      INCOME_DRAFT_KEY,
      JSON.stringify({
        descricao,
        valor,
        tipo,
        data_registro: dataRegistro,
      })
    );
  }, [open, editing, descricao, valor, tipo, dataRegistro]);

  useEffect(() => {
    if (!open) return;
    setSheetOpenState(true);
    return () => {
      setSheetOpenState(false);
    };
  }, [open]);

  const handleSubmit = async () => {
    const parsedValor = Number.parseFloat(valor);

    if (!descricao.trim()) {
      setError('Informe a descrição da receita.');
      return;
    }

    if (!Number.isFinite(parsedValor) || parsedValor <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    if (!dataRegistro) {
      setError('Informe uma data.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        descricao: descricao.trim(),
        valor: parsedValor,
        tipo,
        data_registro: dataRegistro,
      });
      if (!editing && typeof window !== 'undefined') {
        window.localStorage.removeItem(INCOME_DRAFT_KEY);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar receita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div className="glass rounded-t-3xl p-6 pb-10">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-title-2 text-foreground">{editing ? 'Editar' : 'Nova'} receita</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center tap-highlight-none"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descrição"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />

                <input
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  placeholder="Valor (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />

                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as 'fixa' | 'variavel')}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
                >
                  <option value="fixa">Receita fixa</option>
                  <option value="variavel">Receita variável</option>
                </select>

                <input
                  value={dataRegistro}
                  onChange={(event) => setDataRegistro(event.target.value)}
                  type="date"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {error && <p className="text-caption text-destructive mt-3">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="w-full mt-5 py-3.5 rounded-2xl text-headline text-center transition-all tap-highlight-none active:scale-[0.97] gradient-income text-income-foreground shadow-lg shadow-income/20 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar receita'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IncomeSheet;
