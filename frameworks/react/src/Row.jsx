import { unitmap } from 'common/data';

export default function Row({
  row,
  selected,
  setSelected,
  setRows,
  rows,
  isStreaming,
  unitSystem,
  weightConversion,
  lengthConversion,
  powerConversion,
}) {
  return (
    <tr
      className={selected === row.id ? 'selected' : ''}
      onClick={() => !isStreaming && setSelected(row.id)}
    >
      <td>{row.id}</td>
      <td>{row.name}</td>
      <td>
        {(row.weight * weightConversion).toFixed(1)}{' '}
        {unitmap.weight[unitSystem]}
      </td>
      <td>
        {(row.dimensions.height * lengthConversion).toFixed(1)} x{' '}
        {(row.dimensions.width * lengthConversion).toFixed(1)} x{' '}
        {(row.dimensions.depth * lengthConversion).toFixed(1)}{' '}
        {unitmap.length[unitSystem]}
      </td>
      <td>
        {(row.powerConsumption * powerConversion).toFixed(1)}{' '}
        {unitmap.power[unitSystem]}
      </td>
      <td>${row.price.toFixed(2)}</td>
      <td>{row.availabilityStatus}</td>
      <td>{row.rating.toFixed(1)}</td>
      <td>
        <button
          className="small"
          disabled={isStreaming}
          onClick={(e) => {
            e.stopPropagation();
            setRows(rows.filter((r) => r.id !== row.id));
          }}
        >
          delete
        </button>
      </td>
    </tr>
  );
}
