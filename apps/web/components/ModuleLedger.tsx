import type { ReactNode } from "react";

export type LedgerColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
};

export type LedgerRow = {
  label: string;
  values: Record<string, string>;
};

type ModuleLedgerProps = {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  notes?: ReactNode;
  children?: ReactNode;
  ledgerTitle: string;
  columns: LedgerColumn[];
  rows: LedgerRow[];
  emptyMessage?: string;
};

export function ModuleLedger({
  title,
  description,
  actions,
  notes,
  children,
  ledgerTitle,
  columns,
  rows,
  emptyMessage = "No cited rows yet.",
}: ModuleLedgerProps) {
  return (
    <div className="page-content animate-fade-in" style={{ display: "grid", gap: "1.5rem" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1.25rem",
        }}
      >
        <div style={{ flex: "1 1 16rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <h1
              className="font-display"
              style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}
            >
              {title}
            </h1>
            <span className="badge-primary">In build</span>
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              maxWidth: "42rem",
              lineHeight: 1.6,
            }}
          >
            {description}
          </div>
        </div>
        {actions ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {actions}
          </div>
        ) : null}
      </header>

      {notes}

      {children}

      <section className="card-flat" style={{ background: "var(--card)", padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.875rem 1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, letterSpacing: "0.02em" }}>
            {ledgerTitle}
          </h2>
          <span className="weather-pill mono">—</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="audit-table" style={{ minWidth: "28rem" }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ textAlign: col.align === "right" ? "right" : "left" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} style={{ cursor: "default" }}>
                  {columns.map((col, idx) => {
                    const isLabel = idx === 0;
                    const raw = isLabel ? row.label : (row.values[col.key] ?? "—");
                    return (
                      <td
                        key={col.key}
                        className={col.mono || !isLabel ? "mono" : undefined}
                        style={{
                          textAlign: col.align === "right" ? "right" : "left",
                          color: isLabel ? "var(--foreground)" : "var(--muted-foreground)",
                          fontWeight: isLabel ? 500 : 400,
                        }}
                      >
                        {raw}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ cursor: "default" }}>
                <td
                  colSpan={columns.length}
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "0.8125rem",
                    textAlign: "center",
                    padding: "1.25rem 0.75rem",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type DisabledActionButtonProps = {
  label: string;
};

export function DisabledActionButton({ label }: DisabledActionButtonProps) {
  return (
    <button
      className="btn btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      type="button"
      disabled
      title={label}
      style={{
        opacity: 0.55,
        cursor: "not-allowed",
        transform: "none",
        boxShadow: "none",
      }}
    >
      {label}
    </button>
  );
}

type DisabledFieldProps = {
  label: string;
  placeholder?: string;
};

export function DisabledField({ label, placeholder = "—" }: DisabledFieldProps) {
  return (
    <label style={{ display: "grid", gap: "0.375rem", minWidth: 0 }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <input
        type="text"
        disabled
        placeholder={placeholder}
        aria-label={label}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          fontSize: "0.8125rem",
          borderRadius: "var(--radius)",
          border: "1px solid var(--input)",
          background: "hsl(var(--surface-2))",
          color: "var(--muted-foreground)",
          fontFamily: "inherit",
          opacity: 0.85,
        }}
      />
    </label>
  );
}

type EmptyColumnProps = {
  title: string;
  subtitle: string;
};

export function EmptyColumn({ title, subtitle }: EmptyColumnProps) {
  return (
    <div
      className="card-flat"
      style={{
        background: "var(--card)",
        minHeight: "10rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: "0.25rem 0 0" }}>
          {subtitle}
        </p>
      </div>
      <div
        style={{
          flex: 1,
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          alignContent: "stretch",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.625rem 0",
              borderBottom: i < 3 ? "1px solid var(--border)" : "none",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ color: "var(--muted-foreground)" }}>—</span>
            <span className="mono" style={{ color: "var(--muted-foreground)" }}>—</span>
          </div>
        ))}
      </div>
    </div>
  );
}
