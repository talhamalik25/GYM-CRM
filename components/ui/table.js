export default function Table({ columns, rows, getRowKey, className = "", emptyMessage = "No records to show.", ...props }) {
  return (
    <div className="ui-table-wrap">
      <table className={`ui-table ${className}`.trim()} {...props}>
        <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => <tr key={getRowKey ? getRowKey(row) : row.id ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>) : <tr><td className="ui-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
