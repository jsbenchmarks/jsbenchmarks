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
      <td textContent={row.id} />
      <td textContent={row.name} />
      <td
        textContent={
          (row.weight * weightConversion()).toFixed(1) +
          ' ' +
          unitmap.weight[unitSystem()]
        }
      />
      <td
        textContent={
          (row.dimensions.height * lengthConversion()).toFixed(1) +
          ' x ' +
          (row.dimensions.width * lengthConversion()).toFixed(1) +
          ' x ' +
          (row.dimensions.depth * lengthConversion()).toFixed(1) +
          ' ' +
          unitmap.length[unitSystem()]
        }
      />
      <td
        textContent={
          (row.powerConsumption * powerConversion()).toFixed(1) +
          ' ' +
          unitmap.power[unitSystem()]
        }
      />
      <td textContent={'$' + row.price[0]().toFixed(2)} />
      <td textContent={row.availabilityStatus[0]()} />
      <td textContent={row.rating.toFixed(1)} />
      <td>
        <button
          class="small"
          textContent="delete"
          onClick={(e) => {
            e.stopPropagation();
            setRows(rows().filter((r) => r.id !== row.id));
          }}
        />
      </td>
    </tr>
  );
}

export default Row;
