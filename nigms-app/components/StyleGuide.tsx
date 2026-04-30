/**
 * NAILED IT — Industrial Noir Style Guide
 * Route this to /style-guide during development for visual reference.
 * Remove or gate behind admin auth before production.
 */
export default function StyleGuide() {
  return (
    <div className="min-h-screen p-8 space-y-12" style={{ background: "var(--color-bg-base)" }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ color: "var(--color-accent-orange)" }} className="text-glow-orange">
          Nailed It
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
          Industrial Noir Design System — Style Guide
        </p>
        <hr className="divider-chrome" />
      </div>

      {/* ── Color Palette ── */}
      <section>
        <h2>Color Palette</h2>
        <div className="grid grid-cols-2 gap-3 mt-4" style={{ maxWidth: 720 }}>
          {[
            { name: "bg-base",          hex: "#0D0D0F", var: "--color-bg-base" },
            { name: "bg-surface",       hex: "#141418", var: "--color-bg-surface" },
            { name: "bg-elevated",      hex: "#1C1C22", var: "--color-bg-elevated" },
            { name: "bg-overlay",       hex: "#242430", var: "--color-bg-overlay" },
            { name: "steel-dim",        hex: "#2E2E3A", var: "--color-steel-dim" },
            { name: "steel-mid",        hex: "#4A4A5E", var: "--color-steel-mid" },
            { name: "steel-bright",     hex: "#7A7A96", var: "--color-steel-bright" },
            { name: "steel-shine",      hex: "#A8A8C0", var: "--color-steel-shine" },
            { name: "accent-orange",    hex: "#FF6B00", var: "--color-accent-orange" },
            { name: "accent-orange-hover", hex: "#FF8C33", var: "--color-accent-orange-hover" },
            { name: "accent-yellow",    hex: "#FFD600", var: "--color-accent-yellow" },
            { name: "text-primary",     hex: "#F0F0F5", var: "--color-text-primary" },
            { name: "text-secondary",   hex: "#A8A8C0", var: "--color-text-secondary" },
            { name: "text-muted",       hex: "#5C5C78", var: "--color-text-muted" },
            { name: "success",          hex: "#22C55E", var: "--color-success" },
            { name: "error",            hex: "#EF4444", var: "--color-error" },
          ].map((swatch) => (
            <div key={swatch.name} className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: swatch.hex,
                  border: "1px solid var(--color-steel-dim)",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600 }}>
                  {swatch.name}
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: 11, fontFamily: "monospace" }}>
                  {swatch.hex}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <h2>Typography</h2>
        <div className="mt-4 space-y-3">
          <h1>H1 — Barlow Condensed 900</h1>
          <h2>H2 — Barlow Condensed 800</h2>
          <h3>H3 — Barlow Condensed 700</h3>
          <h4>H4 — Barlow Condensed 700</h4>
          <p style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
            Body — Inter 400. Clean, highly legible. Used for all paragraph text, labels, and UI copy.
          </p>
          <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: 14 }}>
            Secondary body — Inter 400, steel-shine. Used for descriptions and supporting text.
          </p>
          <p style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)", fontSize: 13 }}>
            Muted — Inter 400, muted steel. Placeholders, disabled states, timestamps.
          </p>
          <p className="text-chrome" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800 }}>
            CHROME GRADIENT TEXT
          </p>
        </div>
      </section>

      {/* ── Buttons ── */}
      <section>
        <h2>Buttons</h2>
        <div className="flex flex-wrap gap-4 mt-4">
          <button className="btn-primary">Primary CTA</button>
          <button className="btn-primary" disabled>Disabled</button>
          <button className="btn-secondary">Secondary</button>
          <button className="btn-ghost">Ghost / Icon</button>
        </div>
      </section>

      {/* ── Badges ── */}
      <section>
        <h2>Badges</h2>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="badge badge-orange">In Progress</span>
          <span className="badge badge-yellow">Pending</span>
          <span className="badge badge-success">Completed</span>
          <span className="badge badge-error">Overdue</span>
          <span className="badge badge-steel">Draft</span>
        </div>
      </section>

      {/* ── Cards ── */}
      <section>
        <h2>Dashboard Cards</h2>
        <div className="grid grid-cols-1 gap-6 mt-4" style={{ maxWidth: 800 }}>

          {/* Stat / KPI card */}
          <div className="card card-accent" style={{ maxWidth: 280 }}>
            <div className="card-body">
              <div className="stat-label">Open Work Orders</div>
              <div className="stat-value">24</div>
              <div className="stat-delta-positive mt-1">↑ 3 this week</div>
            </div>
          </div>

          {/* Standard content card */}
          <div className="card" style={{ maxWidth: 480 }}>
            <div className="card-header">
              <span className="card-header-title">Recent Activity</span>
            </div>
            <div className="card-body space-y-2">
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                Work order #1042 — Roof inspection completed.
              </p>
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                2 hours ago · John D.
              </p>
            </div>
            <div className="card-footer">
              <button className="btn-ghost" style={{ padding: "0.25rem 0" }}>View all →</button>
            </div>
          </div>

          {/* Steel accent card */}
          <div className="card card-steel" style={{ maxWidth: 480 }}>
            <div className="card-header">
              <span className="card-header-title text-chrome">System Status</span>
            </div>
            <div className="card-body">
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                All services operational.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section>
        <h2>Form Inputs</h2>
        <div className="space-y-4 mt-4" style={{ maxWidth: 400 }}>
          <div>
            <label className="label">Client Name</label>
            <input className="input" placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className="label">Service Type</label>
            <select className="input select">
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>General Maintenance</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Alerts ── */}
      <section>
        <h2>Alerts</h2>
        <div className="space-y-3 mt-4" style={{ maxWidth: 480 }}>
          <div className="alert alert-success">Work order submitted successfully.</div>
          <div className="alert alert-error">Payment failed. Please try again.</div>
          <div className="alert alert-warning">Invoice is overdue by 7 days.</div>
          <div className="alert alert-info">New message from client.</div>
        </div>
      </section>

      {/* ── Table ── */}
      <section>
        <h2>Table</h2>
        <div className="card mt-4">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Client</th>
                <th>Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#1042</td>
                <td>Jane Cooper</td>
                <td>Roof Inspection</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
              <tr>
                <td>#1043</td>
                <td>Robert Fox</td>
                <td>Plumbing Repair</td>
                <td><span className="badge badge-orange">In Progress</span></td>
              </tr>
              <tr>
                <td>#1044</td>
                <td>Emily Chen</td>
                <td>Electrical</td>
                <td><span className="badge badge-yellow">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Dividers ── */}
      <section>
        <h2>Dividers</h2>
        <div className="mt-4 space-y-6" style={{ maxWidth: 480 }}>
          <div>
            <p style={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 8 }}>Standard</p>
            <hr className="divider" style={{ margin: 0 }} />
          </div>
          <div>
            <p style={{ color: "var(--color-text-muted)", fontSize: 12, marginBottom: 8 }}>Chrome shimmer</p>
            <hr className="divider-chrome" style={{ margin: 0 }} />
          </div>
        </div>
      </section>

    </div>
  );
}
