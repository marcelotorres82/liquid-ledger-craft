import { useRef, useState } from 'react';
import { Bot, Camera, Check, FileUp, Mic, PencilLine, Send, Sparkles, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { askCopilot, confirmSmartEntry, importTransactions, parseSmartEntry, saveBudget } from '@/services/api';
import { parseFinancialFile } from '@/lib/importParser';
import { formatCurrency } from '@/lib/format';
import { useFinanceStore } from '@/store/financeStore';
import type { CopilotResponse, SmartTransaction } from '@/types/finance';
import { cn } from '@/lib/utils';

type Mode = 'entry' | 'copilot' | 'import';

const EXAMPLES = [
  'Gastei 86,40 no mercado ontem no Nubank',
  'Recebi 1.500 de freelance hoje',
  'Paguei internet de 119,90',
];

export default function SmartFinanceHub() {
  const navigate = useNavigate();
  const refreshData = useFinanceStore((state) => state.refreshData);
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const [mode, setMode] = useState<Mode>('entry');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<SmartTransaction | null>(null);
  const [copilot, setCopilot] = useState<CopilotResponse | null>(null);
  const [importPreview, setImportPreview] = useState<{ filename: string; format: string; transactions: SmartTransaction[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmingAction, setConfirmingAction] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true); setMessage('');
    try {
      if (mode === 'copilot') setCopilot(await askCopilot(text));
      else {
        const result = await parseSmartEntry(text);
        setPreview(result.transaction);
        setMessage(result.warning || 'Revise os dados antes de confirmar.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível processar agora.');
    } finally { setLoading(false); }
  };

  const confirmEntry = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await confirmSmartEntry(preview);
      await refreshData();
      setPreview(null); setText(''); setMessage('Lançamento salvo com sucesso.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setLoading(false); }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMessage('Reconhecimento de voz não disponível neste navegador.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; recognition.interimResults = false;
    recognition.onresult = (event: any) => setText(event.results[0][0].transcript);
    recognition.onerror = () => setMessage('Não foi possível ouvir. Verifique a permissão do microfone.');
    recognition.start();
  };

  const loadReceipt = (file?: File) => {
    if (!file) return;
    if (file.size > 6_000_000) { setMessage('A imagem deve ter no máximo 6 MB.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true); setMessage('Lendo recibo...');
      try {
        const result = await parseSmartEntry('', String(reader.result));
        setPreview(result.transaction); setMessage('Recibo lido. Revise os dados antes de confirmar.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível ler o recibo.'); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    const parsed = parseFinancialFile(file.name, await file.text());
    setImportPreview({ filename: file.name, ...parsed });
    setMessage(parsed.transactions.length ? `${parsed.transactions.length} lançamentos encontrados.` : 'Não encontrei lançamentos no arquivo.');
  };

  const confirmImport = async () => {
    if (!importPreview?.transactions.length) return;
    setLoading(true);
    try {
      const result = await importTransactions(importPreview);
      await refreshData(); setImportPreview(null);
      setMessage(`${result.imported} lançamentos importados${result.rejected ? `; ${result.rejected} rejeitados` : ''}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha na importação.'); }
    finally { setLoading(false); }
  };

  const executeCopilotAction = async () => {
    if (!copilot?.action || copilot.action.type === 'none') return;
    if (copilot.action.type === 'navigate') { navigate(copilot.action.path || '/analytics'); return; }
    setLoading(true);
    try {
      await saveBudget(copilot.action.category, copilot.action.amount, currentMonth, currentYear);
      setMessage('Orçamento criado.'); setConfirmingAction(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao executar ação.'); }
    finally { setLoading(false); }
  };

  return (
    <GlassCard className="mb-4 smart-hub overflow-hidden relative" delay={0.12}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl gradient-accent flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-white" /></span>
          <div><p className="text-caption uppercase tracking-[0.14em] text-muted-foreground">Copiloto financeiro</p><h2 className="text-headline text-foreground">O que você quer fazer?</h2></div>
        </div>
        <span className="ai-meta-chip"><Bot className="w-3.5 h-3.5" /> IA + regras seguras</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-secondary/60 mb-3" role="tablist">
        {([
          ['entry', PencilLine, 'Lançar'], ['copilot', Bot, 'Perguntar'], ['import', FileUp, 'Importar'],
        ] as const).map(([key, Icon, label]) => (
          <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => { setMode(key); setMessage(''); }}
            className={cn('rounded-xl py-2 px-2 flex items-center justify-center gap-1.5 text-caption font-semibold transition-colors', mode === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {mode !== 'import' && (
        <>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="smart-finance-input">{mode === 'copilot' ? 'Pergunta financeira' : 'Descrição do lançamento'}</label>
            <textarea id="smart-finance-input" value={text} onChange={(event) => setText(event.target.value)} rows={2}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void run(); } }}
              placeholder={mode === 'copilot' ? 'Ex.: onde posso economizar R$ 500 por mês?' : 'Ex.: gastei R$ 86,40 no mercado ontem'}
              className="flex-1 rounded-2xl bg-secondary/55 border border-border/70 px-3.5 py-3 text-subhead text-foreground resize-none outline-none focus:ring-2 focus:ring-primary/30" />
            {mode === 'entry' && <><button type="button" onClick={startVoice} className="w-11 rounded-2xl border border-border/70 bg-secondary/60 flex items-center justify-center" aria-label="Ditado por voz"><Mic className="w-4 h-4" /></button><input ref={receiptRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => loadReceipt(event.target.files?.[0])} /><button type="button" onClick={() => receiptRef.current?.click()} className="w-11 rounded-2xl border border-border/70 bg-secondary/60 flex items-center justify-center" aria-label="Fotografar recibo"><Camera className="w-4 h-4" /></button></>}
            <button type="button" onClick={() => void run()} disabled={loading || !text.trim()} className="w-11 rounded-2xl bg-foreground text-background flex items-center justify-center disabled:opacity-50" aria-label="Enviar"><Send className="w-4 h-4" /></button>
          </div>
          {!preview && !copilot && mode === 'entry' && <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1 scrollbar-hide">{EXAMPLES.map((example) => <button key={example} onClick={() => setText(example)} className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-border/60 text-muted-foreground">{example}</button>)}</div>}
        </>
      )}

      {mode === 'import' && (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <UploadCloud className="w-7 h-7 mx-auto mb-2 text-primary" /><p className="text-subhead font-semibold">Extrato CSV ou OFX</p>
          <p className="text-caption text-muted-foreground mt-1 mb-3">Prévia e prevenção de arquivo duplicado antes de salvar.</p>
          <input ref={fileRef} type="file" accept=".csv,.ofx,text/csv" className="hidden" onChange={(event) => void loadFile(event.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-foreground text-background px-4 py-2 text-caption font-semibold">Escolher arquivo</button>
        </div>
      )}

      {preview && mode === 'entry' && (
        <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
          <div className="flex justify-between gap-3"><div><p className="text-caption text-muted-foreground">Prévia · confiança {Math.round(preview.confidence * 100)}%</p><input value={preview.description} onChange={(e) => setPreview({ ...preview, description: e.target.value })} className="bg-transparent text-headline font-semibold outline-none w-full" /></div><button onClick={() => setPreview(null)} aria-label="Descartar prévia"><X className="w-4 h-4" /></button></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <label className="text-[10px] text-muted-foreground">VALOR<input type="number" step="0.01" value={preview.amount} onChange={(e) => setPreview({ ...preview, amount: Number(e.target.value) })} className="block w-full bg-card/70 rounded-lg p-2 text-subhead text-foreground" /></label>
            <label className="text-[10px] text-muted-foreground">DATA<input type="date" value={preview.date} onChange={(e) => setPreview({ ...preview, date: e.target.value })} className="block w-full bg-card/70 rounded-lg p-2 text-subhead text-foreground" /></label>
            <label className="text-[10px] text-muted-foreground">CATEGORIA<input value={preview.categoryKey} onChange={(e) => setPreview({ ...preview, categoryKey: e.target.value })} className="block w-full bg-card/70 rounded-lg p-2 text-subhead text-foreground" /></label>
            <label className="text-[10px] text-muted-foreground">CONTA<input value={preview.account} onChange={(e) => setPreview({ ...preview, account: e.target.value })} className="block w-full bg-card/70 rounded-lg p-2 text-subhead text-foreground" /></label>
          </div>
          <button type="button" onClick={() => void confirmEntry()} disabled={loading} className="mt-3 w-full rounded-xl py-2.5 bg-foreground text-background flex items-center justify-center gap-2 text-subhead font-semibold"><Check className="w-4 h-4" />Confirmar {preview.kind === 'income' ? 'receita' : 'despesa'} de {formatCurrency(preview.amount)}</button>
        </div>
      )}

      {copilot && mode === 'copilot' && (
        <div className="mt-3 rounded-2xl border border-border/70 bg-secondary/45 p-4">
          <p className="text-caption text-primary uppercase tracking-wider">{copilot.source} · {copilot.model}</p><h3 className="text-headline font-semibold mt-1">{copilot.headline}</h3><p className="text-subhead mt-2">{copilot.answer}</p>
          {copilot.notice && <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-caption text-foreground">{copilot.notice}</p>}
          {copilot.evidence.length > 0 && <ul className="mt-3 space-y-1">{copilot.evidence.map((item) => <li key={item} className="text-caption text-muted-foreground">• {item}</li>)}</ul>}
          {copilot.action.type !== 'none' && !confirmingAction && <button onClick={() => setConfirmingAction(true)} className="mt-3 rounded-xl bg-foreground text-background px-4 py-2 text-caption font-semibold">{copilot.action.label}</button>}
          {confirmingAction && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-warning/30 p-3"><p className="text-caption">Confirmar esta ação?</p><div className="flex gap-2"><button onClick={() => setConfirmingAction(false)} className="px-3 py-1.5 text-caption">Cancelar</button><button onClick={() => void executeCopilotAction()} className="px-3 py-1.5 rounded-lg bg-foreground text-background text-caption">Confirmar</button></div></div>}
        </div>
      )}

      {importPreview && mode === 'import' && <div className="mt-3 rounded-2xl bg-secondary/50 border border-border/60 p-3 flex items-center justify-between gap-3"><div><p className="text-subhead font-semibold truncate">{importPreview.filename}</p><p className="text-caption text-muted-foreground">{importPreview.transactions.length} lançamentos · {importPreview.format.toUpperCase()}</p></div><button onClick={() => void confirmImport()} disabled={loading} className="rounded-xl bg-foreground text-background px-3 py-2 text-caption font-semibold">Importar</button></div>}
      {message && <p role="status" className="mt-3 text-caption text-muted-foreground">{message}</p>}
    </GlassCard>
  );
}
