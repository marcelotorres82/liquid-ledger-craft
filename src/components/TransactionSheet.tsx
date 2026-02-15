import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Transaction } from "@/store/financeStore";

interface TransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, "id">) => void;
  initial?: Transaction | null;
  type: "income" | "expense";
  categories: string[];
  icons: string[];
}

const TransactionSheet = ({ open, onClose, onSave, initial, type, categories, icons }: TransactionSheetProps) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDate(initial.date);
      setIcon(initial.icon);
    } else {
      setTitle("");
      setAmount("");
      setCategory(categories[0] || "");
      setDate(new Date().toLocaleDateString("pt-BR"));
      setIcon(icons[0] || "📝");
    }
  }, [initial, open, categories, icons]);

  const handleSave = () => {
    if (!title || !amount) return;
    onSave({ title, amount: parseFloat(amount), category, date, icon });
    onClose();
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div className="glass rounded-t-3xl p-6 pb-10">
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-title-2 text-foreground">
                  {initial ? "Editar" : "Nova"} {type === "income" ? "Receita" : "Despesa"}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center tap-highlight-none">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Icon picker */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-all tap-highlight-none ${
                      icon === ic ? "bg-primary/15 ring-2 ring-primary/30 scale-110" : "bg-secondary"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Valor (R$)"
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Data (DD/MM/AAAA)"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground text-subhead placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <button
                onClick={handleSave}
                className={`w-full mt-5 py-3.5 rounded-2xl text-headline text-center transition-all tap-highlight-none active:scale-[0.97] ${
                  type === "income"
                    ? "gradient-income text-income-foreground shadow-lg shadow-income/20"
                    : "gradient-expense text-expense-foreground shadow-lg shadow-expense/20"
                }`}
              >
                {initial ? "Salvar Alterações" : "Adicionar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransactionSheet;
