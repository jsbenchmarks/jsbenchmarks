/** @jsxImportSource preact */
import { unitmap } from 'common/data';
import { lengthConversion, powerConversion, rows, selected, unitSystem, weightConversion } from './app.jsx';

export function Row({ row }) {
  const isSelected = selected.value === row.id;
  const handleClick = () => {
    selected.value = row.id;
  };

  const deleteRow = (e) => {
    e.stopPropagation();
    rows.value = rows.value.filter((r) => r.id !== row.id);
  };

  return (
    <tr class={isSelected ? 'selected' : ''} onClick={handleClick}>
      <td>{row.id}</td>
      <td>{row.name}</td>
      <td>
        {(row.weight * weightConversion.value).toFixed(1)}{' '}
        {unitmap.weight[unitSystem.value]}
      </td>
      <td>
        {(row.dimensions.height * lengthConversion.value).toFixed(1)} x{' '}
        {(row.dimensions.width * lengthConversion.value).toFixed(1)} x{' '}
        {(row.dimensions.depth * lengthConversion.value).toFixed(1)}{' '}
        {unitmap.length[unitSystem.value]}
      </td>
      <td>
        {(row.powerConsumption * powerConversion.value).toFixed(1)}{' '}
        {unitmap.power[unitSystem.value]}
      </td>
      <td>${row.price.toFixed(2)}</td>
      <td>{row.availabilityStatus}</td>
      <td>{row.rating.toFixed(1)}</td>
      <td>
        <button class="small" onClick={deleteRow}>delete</button>
      </td>
    </tr>
  );
}
