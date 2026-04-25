// src/components/Explorer.tsx
import { useState, useMemo } from 'react';
import CrossRef, { type CrossRefEntry } from './CrossRef';
import './Explorer.css';

// ---------- Types ----------

export interface OrdenamientoMetaEntry {
  tag: string;
  slug: string;
  ambito: 'federal' | 'estatal';
  nombre?: { prefix: string; core: string; suffix: string };
  nombre_display?: {
    prefix_italic: string;
    core_bold_italic: string;
    suffix_italic_small: string;
  };
}

export interface Metric {
  number: number | string;
  label: string;
}

export interface TabFilterConfig {
  field: string;
  allLabel: string;
  options: string[];
}

export interface SelectFilterConfig {
  field: string;
  label: string;
  options?: string[];
  allLabel?: string;
}

export interface DistributionConfig {
  groupBy: string;
  stackBy: string;
  stackOrder: string[];
  colorMap: Record<string, string>;
  sortBy?: 'count' | 'name';
  heading: string;
}

export interface ItemFields {
  numero: string;
  ordTag: string;
  tipo: string;
  texto: string;
  articulo: string;
  prioridad: string;
  titulo?: string;
  badge?: string;
}

export interface ExplorerConfig {
  metrics: Metric[];
  distribution: DistributionConfig;
  tabFilter: TabFilterConfig;
  selectFilters: SelectFilterConfig[];
  itemFields: ItemFields;
  sectionCode: string;
}

export interface ExplorerItem {
  id: string;
  [key: string]: unknown;
}

interface ExplorerProps {
  data: ExplorerItem[];
  config: ExplorerConfig;
  ordenamientoMeta: Record<string, OrdenamientoMetaEntry>;
  crossRefs: Record<string, CrossRefEntry>;
}

// ---------- Subcomponents ----------

function OrdName({ meta }: { meta: OrdenamientoMetaEntry }) {
  if (!meta) return null;

  const nd = meta.nombre_display;
  const nb = meta.nombre;
  const href =
    meta.ambito && meta.slug
      ? '/marco/' + meta.ambito + '/' + meta.slug
      : '#';

  let fullName: string;
  if (nb) {
    fullName = (nb.prefix || '') + (nb.core || '') + (nb.suffix || '');
  } else if (nd) {
    fullName =
      (nd.prefix_italic || '') +
      (nd.core_bold_italic || '') +
      (nd.suffix_italic_small || '');
  } else {
    fullName = meta.tag || '';
  }

  let display: JSX.Element;
  if (nd && nd.core_bold_italic) {
    display = (
      <span className="ord-name">
        {nd.prefix_italic && <i>{nd.prefix_italic}</i>}
        <b>{nd.core_bold_italic}</b>
        {nd.suffix_italic_small && <small>{nd.suffix_italic_small}</small>}
      </span>
    );
  } else if (nb && nb.core) {
    display = (
      <span className="ord-name">
        {nb.prefix && <i>{nb.prefix}</i>}
        <b>{nb.core}</b>
        {nb.suffix && <small>{nb.suffix}</small>}
      </span>
    );
  } else {
    display = <span className="ord-name">{meta.tag}</span>;
  }

  return (
    <a href={href} className="ord-name-link" title={fullName || meta.tag}>
      {display}
    </a>
  );
}

function PriorityTag({ value }: { value: string }) {
  const cls = (value || '').toLowerCase();
  return <span className={'tag tag-' + cls}>{value}</span>;
}

const XREF_PATTERN = /\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g;

function RichText({
  text,
  crossRefs,
}: {
  text: string;
  crossRefs: Record<string, CrossRefEntry>;
}) {
  const parts: Array<string | JSX.Element> = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(XREF_PATTERN.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const code = match[0];
    parts.push(
      <CrossRef key={'xr-' + i++ + '-' + code} code={code} crossRefs={crossRefs} />
    );
    lastIdx = match.index + code.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return <>{parts}</>;
}

// ---------- Main ----------

export default function Explorer({
  data,
  config,
  ordenamientoMeta,
  crossRefs,
}: ExplorerProps) {
  const [activeTab, setActiveTab] = useState<string>(config.tabFilter.allLabel);
  const [selectValues, setSelectValues] = useState<Record<string, string>>(
    Object.fromEntries(
      config.selectFilters.map((f) => [f.field, f.allLabel ?? 'Todos'])
    )
  );

  const selectOptions = useMemo(() => {
    return Object.fromEntries(
      config.selectFilters.map((f) => [
        f.field,
        f.options ??
          Array.from(
            new Set(data.map((d) => String(d[f.field] ?? '')).filter(Boolean))
          ).sort(),
      ])
    );
  }, [data, config.selectFilters]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (
        activeTab !== config.tabFilter.allLabel &&
        item[config.tabFilter.field] !== activeTab
      ) {
        return false;
      }
      for (const f of config.selectFilters) {
        const v = selectValues[f.field];
        const allLabel = f.allLabel ?? 'Todos';
        if (v !== allLabel && item[f.field] !== v) return false;
      }
      return true;
    });
  }, [data, activeTab, selectValues, config]);

  const distribution = useMemo(() => {
    const { groupBy, stackBy, sortBy } = config.distribution;
    const groups: Record<string, Record<string, number>> = {};
    for (const item of data) {
      const g = String(item[groupBy] ?? '—');
      const s = String(item[stackBy] ?? '—');
      if (!groups[g]) groups[g] = {};
      groups[g][s] = (groups[g][s] || 0) + 1;
    }
    let rows = Object.entries(groups).map(([group, counts]) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { group, counts, total };
    });
    if (sortBy === 'name') {
      rows.sort((a, b) => a.group.localeCompare(b.group));
    } else {
      rows.sort((a, b) => b.total - a.total || a.group.localeCompare(b.group));
    }
    const maxTotal = Math.max(...rows.map((r) => r.total), 1);
    return { rows, maxTotal };
  }, [data, config.distribution]);

  const metricsGridStyle = {
    gridTemplateColumns: 'repeat(' + config.metrics.length + ', 1fr)',
  };

  return (
    <div className="explorer">
      {/* Metricas */}
      <div className="metrics-row" style={metricsGridStyle}>
        {config.metrics.map((m, i) => (
          <div key={i} className="metric">
            <div className="metric-number">{m.number}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      <hr className="hairline" />

      {/* Distribucion */}
      <section className="distribution">
        <div className="distribution-header">
          <span className="eyebrow distribution-eyebrow">
            {config.distribution.heading}
          </span>
          <div className="distribution-legend">
            {config.distribution.stackOrder.map((k) => (
              <span key={k} className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ background: config.distribution.colorMap[k] }}
                />
                <span className="legend-label">{k}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="distribution-rows">
          {distribution.rows.map((row) => {
            const meta = ordenamientoMeta[row.group];
            return (
              <div key={row.group} className="bar-row">
                <div className="bar-label">
                  {meta ? (
                    <OrdName meta={meta} />
                  ) : (
                    <span className="ord-name">{row.group}</span>
                  )}
                </div>
                <div className="bar-count">{row.total}</div>
                <div className="bar-track">
                  {config.distribution.stackOrder.map((key) => {
                    const n = row.counts[key] || 0;
                    if (!n) return null;
                    const pct = (n / distribution.maxTotal) * 100;
                    return (
                      <div
                        key={key}
                        className="bar-segment"
                        style={{
                          width: pct + '%',
                          background: config.distribution.colorMap[key],
                        }}
                        title={key + ': ' + n}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="hairline" />

      {/* Filtros */}
      <div className="filter-bar">
        <div className="filter-tabs" role="tablist">
          <button
            type="button"
            className={
              'tab ' +
              (activeTab === config.tabFilter.allLabel ? 'active' : '')
            }
            onClick={() => setActiveTab(config.tabFilter.allLabel)}
          >
            {config.tabFilter.allLabel}
          </button>
          {config.tabFilter.options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={'tab ' + (activeTab === opt ? 'active' : '')}
              onClick={() => setActiveTab(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          {config.selectFilters.map((f) => {
            const allLabel = f.allLabel ?? 'Todos';
            return (
              <label key={f.field} className="filter-select">
                <span className="filter-select-label">{f.label}</span>
                <select
                  value={selectValues[f.field]}
                  onChange={(e) =>
                    setSelectValues((prev) => ({
                      ...prev,
                      [f.field]: e.target.value,
                    }))
                  }
                >
                  <option value={allLabel}>{allLabel}</option>
                  {selectOptions[f.field].map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </div>

      <div className="count-display">
        <span className="count-number">{filtered.length}</span>
        <span className="count-total"> / {data.length}</span>
      </div>

      {/* Items */}
      <ol className="explorer-items">
        {filtered.map((item) => {
          const ordTag = String(item[config.itemFields.ordTag] ?? '');
          const meta = ordenamientoMeta[ordTag];
          const numero = item[config.itemFields.numero];
          const tipo = String(item[config.itemFields.tipo] ?? '');
          const texto = String(item[config.itemFields.texto] ?? '');
          const articulo = String(item[config.itemFields.articulo] ?? '');
          const prioridad = String(item[config.itemFields.prioridad] ?? '');
          const titulo = config.itemFields.titulo
            ? String(item[config.itemFields.titulo] ?? '')
            : '';
          const badge = config.itemFields.badge
            ? String(item[config.itemFields.badge] ?? '')
            : '';

          return (
            <li key={item.id} className="explorer-item">
              <div className="explorer-number">
                {String(numero).padStart(2, '0')}
              </div>
              <div className="explorer-body">
                <div className="explorer-meta">
                  {meta ? (
                    <OrdName meta={meta} />
                  ) : (
                    <span className="ord-name">{ordTag}</span>
                  )}
                  <span className="explorer-sep" aria-hidden="true" />
                  <span className="explorer-tipo">{tipo}</span>
                  <span className="explorer-sep" aria-hidden="true" />
                  <span className="explorer-articulo">{articulo}</span>
                  {badge && (
                    <>
                      <span className="explorer-sep" aria-hidden="true" />
                      <span className="explorer-badge">{badge}</span>
                    </>
                  )}
                </div>
                {titulo && <h3 className="explorer-titulo">{titulo}</h3>}
                <p className="explorer-text">
                  <RichText text={texto} crossRefs={crossRefs} />
                </p>
                <div className="explorer-id">
                  <CrossRef code={item.id} crossRefs={crossRefs}>
                    {item.id}
                  </CrossRef>
                </div>
              </div>
              <div className="explorer-tag-col">
                <PriorityTag value={prioridad} />
              </div>
            </li>
          );
        })}
      </ol>

      {filtered.length === 0 && (
        <div className="explorer-empty">
          No hay resultados para la combinación de filtros seleccionada.
        </div>
      )}

      <div className="explorer-watermark">
        Observatorio del Sistema de Energía de Jalisco · CC BY-NC-SA 4.0
      </div>
    </div>
  );
}
