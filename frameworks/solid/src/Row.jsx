import { unitmap } from 'common/data';
import {
    lengthConversion,
    powerConversion,
    rows,
    setRows,
    setSelected,
    unitSystem,
    weightConversion,
    isSelected,
} from './App';

function Row({ row }) {
  return (
    <tr
      class={isSelected(row.id) ? 'selected' : ''}
      onClick={() => setSelected(row.id)}
    >
      <td>{row.id}</td>
      <td>{row.name}</td>
      <td>
        {(row.weight * weightConversion()).toFixed(1)}{' '}
        {unitmap.weight[unitSystem()]}
      </td>
      <td>
        {(row.dimensions.height * lengthConversion()).toFixed(1)} x{' '}
        {(row.dimensions.width * lengthConversion()).toFixed(1)} x{' '}
        {(row.dimensions.depth * lengthConversion()).toFixed(1)}{' '}
        {unitmap.length[unitSystem()]}
      </td>
      <td>
        {(row.powerConsumption * powerConversion()).toFixed(1)}{' '}
        {unitmap.power[unitSystem()]}
      </td>
      <td>${row.price[0]().toFixed(2)}</td>
      <td>{row.availabilityStatus[0]()}</td>
      <td>{row.rating.toFixed(1)}</td>
      <td>
        <button
          class="small"
          onClick={(e) => {
            e.stopPropagation();
            setRows(rows().filter((r) => r.id !== row.id));
          }}
        >
          delete
        </button>
      </td>
    </tr>
  );
}

export default Row;
