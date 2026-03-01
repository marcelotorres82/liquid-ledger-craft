import {
  BriefcaseBusiness,
  Car,
  CircleDollarSign,
  CreditCard,
  Dumbbell,
  House,
  LineChart,
  Palette,
  Pill,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { parseExpenseDescription } from '@/lib/expenseMeta';

interface IconSpec {
  Icon: LucideIcon;
  colorClass: string;
}

function normalizeText(value: string): string {
  return String(value || '').toLowerCase();
}

function renderIcon({ Icon, colorClass }: IconSpec) {
  return <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.2} />;
}

export function getIncomeIcon(description: string) {
  const text = normalizeText(description);

  if (/sal[aá]rio|trabalho|holerite/.test(text)) {
    return renderIcon({ Icon: BriefcaseBusiness, colorClass: 'text-amber-700 dark:text-amber-300' });
  }

  if (/freela|freelance|design|projeto/.test(text)) {
    return renderIcon({ Icon: Palette, colorClass: 'text-orange-500 dark:text-orange-300' });
  }

  if (/dividend|invest/.test(text)) {
    return renderIcon({ Icon: LineChart, colorClass: 'text-rose-500 dark:text-rose-300' });
  }

  if (/cashback|cart[aã]o/.test(text)) {
    return renderIcon({ Icon: CreditCard, colorClass: 'text-yellow-500 dark:text-yellow-300' });
  }

  return renderIcon({ Icon: CircleDollarSign, colorClass: 'text-emerald-500 dark:text-emerald-300' });
}

export function getExpenseIcon(description: string, fallbackTipo: 'fixa' | 'avulsa' | 'parcelada') {
  const parsed = parseExpenseDescription(description, fallbackTipo);
  const text = normalizeText(parsed.description);

  if (/aluguel|moradia|condom[ií]nio|iptu|im[oó]vel|casa/.test(text)) {
    return renderIcon({ Icon: House, colorClass: 'text-amber-500 dark:text-amber-300' });
  }

  if (/stream|netflix|spotify|youtube|prime|hbo|disney|entretenimento/.test(text)) {
    return renderIcon({ Icon: Tv, colorClass: 'text-sky-500 dark:text-sky-300' });
  }

  if (/(uber|99|taxi|transporte|gasolina|combust[ií]vel)/.test(text)) {
    return renderIcon({ Icon: Car, colorClass: 'text-red-500 dark:text-red-300' });
  }

  if (/(academia|fitness|muscula|treino|crossfit)/.test(text)) {
    return renderIcon({ Icon: Dumbbell, colorClass: 'text-yellow-500 dark:text-yellow-300' });
  }

  if (/(farm[aá]cia|rem[eé]dio|medic|droga)/.test(text)) {
    return renderIcon({ Icon: Pill, colorClass: 'text-rose-500 dark:text-rose-300' });
  }

  if (/(internet|wifi|banda|telefonia|telefone)/.test(text)) {
    return renderIcon({ Icon: Wifi, colorClass: 'text-cyan-500 dark:text-cyan-300' });
  }

  if (/(restaurante|ifood|food|lanche|jantar|almo[çc]o)/.test(text)) {
    return renderIcon({ Icon: UtensilsCrossed, colorClass: 'text-slate-500 dark:text-slate-300' });
  }

  if (/(supermerc|mercado|feira|hortifruti|compra)/.test(text)) {
    return renderIcon({ Icon: ShoppingCart, colorClass: 'text-sky-500 dark:text-sky-300' });
  }

  if (parsed.category === 'contas_fixas') {
    return renderIcon({ Icon: House, colorClass: 'text-amber-500 dark:text-amber-300' });
  }

  if (parsed.category === 'alimentacao') {
    return renderIcon({ Icon: UtensilsCrossed, colorClass: 'text-slate-500 dark:text-slate-300' });
  }

  if (parsed.category === 'compras') {
    return renderIcon({ Icon: ShoppingCart, colorClass: 'text-sky-500 dark:text-sky-300' });
  }

  if (parsed.category === 'entretenimento') {
    return renderIcon({ Icon: Tv, colorClass: 'text-sky-500 dark:text-sky-300' });
  }

  return renderIcon({ Icon: Wallet, colorClass: 'text-violet-500 dark:text-violet-300' });
}
