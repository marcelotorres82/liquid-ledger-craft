import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, BrainCircuit, ChevronRight, Cpu, Sparkles, WandSparkles } from 'lucide-react';
import { sparkleItemAnimate, sparkleItemInitial, sparkleTransition } from '@/lib/motion';
import type { ActionableInsight } from '@/types/finance';
import { formatCurrency } from '@/lib/format';

interface AiInsightsCardProps {
  lines: string[];
  hint: string;
  isLoading: boolean;
  source: string;
  model: string;
  onRefresh: () => void;
  insights?: ActionableInsight[];
  summary?: string;
  onAction?: (insight: ActionableInsight) => Promise<void> | void;
}

function renderBoldSegments(text: string) {
  return String(text || '')
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      const matched = part.match(/^\*\*(.+)\*\*$/);
      if (matched) {
        return (
          <strong key={`bold-${index}`} className="font-semibold text-foreground">
            {matched[1]}
          </strong>
        );
      }

      return <span key={`plain-${index}`}>{part}</span>;
    });
}

const AiInsightsCard = ({ lines, hint, isLoading, source, model, onRefresh, insights = [], summary = '', onAction }: AiInsightsCardProps) => {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const normalizedSource = String(source || '').trim();
  const normalizedModel = String(model || '').trim();
  const sourceUnavailable = /n[aã]o informad[ao]/i.test(normalizedSource);
  const modelUnavailable = /n[aã]o informad[ao]/i.test(normalizedModel);

  const providerLabel =
    normalizedSource === 'gemini'
      ? 'Google Gemini'
      : normalizedSource === 'fallback'
      ? 'Motor local'
      : normalizedSource;
  const normalizedHint = String(hint || '').trim();
  const hideHint = lines.length === 0 && /nenhum insight/i.test(normalizedHint);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0 }}
      transition={sparkleTransition}
      className="glass-card ai-intelligence-card mb-6 overflow-hidden"
    >
      <div className="ai-glow" aria-hidden="true" />

      <header className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <div className="ai-orb-pulse" aria-hidden="true" />
            <div className="ai-orb" aria-hidden="true">
              <Sparkles className="w-4 h-4 text-foreground" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-caption uppercase tracking-[0.16em] text-muted-foreground">IA em uso</p>
            <h2 className="text-title-3 text-foreground leading-tight">Insights de IA</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="ai-refresh-btn"
        >
          {isLoading ? 'Gerando...' : 'Atualizar'}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
        {providerLabel && !sourceUnavailable && (
          <span className="ai-meta-chip">
            <Cpu className="w-3.5 h-3.5" />
            {providerLabel}
          </span>
        )}
        {normalizedModel && !modelUnavailable && (
          <span className="ai-meta-chip">
            <Bot className="w-3.5 h-3.5" />
            {normalizedModel}
          </span>
        )}
        <span className="ai-brain-widget">
          <BrainCircuit className="w-3.5 h-3.5 text-foreground" />
          <span className="text-caption text-foreground">Leitura contextual ativa</span>
        </span>
      </div>

      {summary && <p className="text-subhead text-muted-foreground mb-3 relative z-10">{summary}</p>}
      <div className="space-y-2.5 relative z-10">
        {isLoading && lines.length === 0 ? (
          <div className="space-y-2">
            <div className="ai-skeleton h-11" />
            <div className="ai-skeleton h-11" />
            <div className="ai-skeleton h-11" />
          </div>
        ) : insights.length > 0 ? (
          insights.map((item, index) => (
            <motion.article key={`${item.title}-${index}`} initial={sparkleItemInitial} animate={sparkleItemAnimate}
              transition={{ ...sparkleTransition, delay: 0.08 * index }} className={`ai-insight-item ai-severity-${item.severity}`}>
              <div className="ai-insight-badge">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2"><p className="text-subhead font-semibold text-foreground">{item.title}</p>{item.impact !== 0 && <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{formatCurrency(Math.abs(item.impact))}</span>}</div>
                <p className="text-caption text-foreground mt-1">{item.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">Evidência: {item.evidence}</p>
                <p className="text-caption text-muted-foreground mt-1.5">{item.recommendation}</p>
                {item.actionType !== 'none' && confirmIndex !== index && <button type="button" onClick={() => setConfirmIndex(index)} className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary">{item.actionLabel}<ChevronRight className="w-3.5 h-3.5" /></button>}
                {confirmIndex === index && <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/70 p-2"><span className="text-[10px] text-muted-foreground">Executar esta ação?</span><div className="flex gap-1"><button onClick={() => setConfirmIndex(null)} className="px-2 py-1 text-[10px]">Cancelar</button><button onClick={async () => { await onAction?.(item); setConfirmIndex(null); }} className="px-2 py-1 rounded-lg bg-foreground text-background text-[10px]">Confirmar</button></div></div>}
              </div>
            </motion.article>
          ))
        ) : lines.length > 0 ? (
          lines.map((line, index) => (
            <motion.article
              key={`${line}-${index}`}
              initial={sparkleItemInitial}
              animate={sparkleItemAnimate}
              transition={{ ...sparkleTransition, delay: 0.08 * index }}
              className="ai-insight-item"
            >
              <div className="ai-insight-badge">{index + 1}</div>
              <p className="text-subhead text-foreground flex-1">{renderBoldSegments(line)}</p>
            </motion.article>
          ))
        ) : (
          <div className="ai-insight-item">
            <div className="ai-insight-badge">AI</div>
            <p className="text-subhead text-muted-foreground flex-1">
              Nenhum insight disponível no momento. Toque em Atualizar para gerar uma nova leitura.
            </p>
          </div>
        )}
      </div>

      {normalizedHint && !hideHint && (
        <div className="ai-footnote mt-4 relative z-10">
          <WandSparkles className="w-3.5 h-3.5 shrink-0" />
          <p>{normalizedHint}</p>
        </div>
      )}
    </motion.section>
  );
};

export default AiInsightsCard;
