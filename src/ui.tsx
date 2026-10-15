import {
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ReactElement,
} from "react";
import { X, ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
export function Card({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <ArrowUpRight size={30} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<any>, {
            "aria-labelledby": labelId,
          })
        : children}
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose?.();
        if (e.key === "Tab") {
          const nodes = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              'button,input,select,textarea,[tabindex="0"]',
            ),
          ).filter((n) => !n.hasAttribute("disabled"));
          const first = nodes[0],
            last = nodes.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <header>
          <h2>{title}</h2>
          {onClose && (
            <button aria-label="Kapat" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </header>
        {children}
      </section>
    </div>
  );
}
export function Chart({
  data,
  dataKey = "value",
  color = "var(--accent)",
  unit = "",
}: {
  data: Record<string, unknown>[];
  dataKey?: string;
  color?: string;
  unit?: string;
}) {
  return data.length ? (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
            }}
            formatter={(v) => [`${v} ${unit}`, "Değer"]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            fill={`url(#fill-${dataKey})`}
            dot={{ r: 3, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <Empty title="Grafiğin burada başlayacak">
      <p>İlk kaydını ekleyerek gelişimini izlemeye başla.</p>
    </Empty>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Stat({
  label,
  value,
  unit,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="card stat">
      <div className="stat-top">
        {label}
        <span>{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <p>{detail}</p>
    </div>
  );
}
export const formData = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
};
