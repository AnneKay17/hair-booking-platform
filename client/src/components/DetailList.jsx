/** Label/value rows. Rows with an empty value are skipped. */
export default function DetailList({ rows }) {
  const visibleRows = rows.filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== ""
  );

  return (
    <dl className="detail-list">
      {visibleRows.map((row) => (
        <div className="detail-row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}