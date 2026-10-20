import Card from "../ui/card";

function compactValue(value) {
  return Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function describeChart(categories, series, formatValue) {
  return categories.map((category) => `${category.label}: ${series.map((item) => `${item.label} ${formatValue(item.values[category.key] || 0)}`).join(", ")}`).join(". ");
}

export default function AnalyticsBarChart({ title, description, categories, series, formatValue = (value) => Number(value).toLocaleString(), emptyMessage = "No recorded data is available for this period.", className = "" }) {
  const values = categories.flatMap((category) => series.map(({ values: data }) => Number(data[category.key] || 0)));
  const maximum = Math.max(0, ...values);
  const hasData = maximum > 0;

  return <Card className={`dashboard-chart-card ${className} p-5 md:p-6`}>
    <header className="dashboard-chart-header">
      <div><h3>{title}</h3><p>{description}</p></div>
      <div className="dashboard-chart-legend" aria-label={`${title} legend`}>
        {series.map((item) => <span key={item.key}><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span>)}
      </div>
    </header>
    {hasData ? <div className="dashboard-chart-scroll">
      <div className="dashboard-chart-plot" role="img" aria-label={`${title}. ${describeChart(categories, series, formatValue)}`} style={{ "--chart-columns": categories.length, minWidth: `${Math.max(categories.length * 48, 220)}px` }}>
        {categories.map((category) => <div className="dashboard-chart-category" key={category.key}>
          <div className="dashboard-chart-bars" aria-hidden="true">
            {series.map((item) => {
              const value = Number(item.values[category.key] || 0);
              const height = value === 0 ? 0 : Math.max(2, value / maximum * 100);
              return <div className="dashboard-chart-bar" key={item.key} title={`${category.label} · ${item.label}: ${formatValue(value)}`} style={{ height: `${height}%`, backgroundColor: category.color || item.color }}>
                {value > 0 && <span className="dashboard-chart-bar-value">{compactValue(value)}</span>}
              </div>;
            })}
          </div>
          <span className="dashboard-chart-category-label">{category.label}</span>
        </div>)}
      </div>
    </div> : <p className="dashboard-chart-empty" role="status">{emptyMessage}</p>}
  </Card>;
}
