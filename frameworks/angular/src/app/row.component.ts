import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { unitmap } from 'common/data';

@Component({
  selector: 'tr[app-row]', 
  standalone: true,
  imports: [CommonModule],
  template: `
      <td>{{row.id}}</td>
      <td>{{row.name}}</td>
      <td>
        {{ (row.weight * weightConversion).toFixed(1) }} 
        {{ unitmap.weight[unitSystem] }}
      </td>
      <td>
        {{ (row.dimensions.height * lengthConversion).toFixed(1) }} x 
        {{ (row.dimensions.width * lengthConversion).toFixed(1) }} x 
        {{ (row.dimensions.depth * lengthConversion).toFixed(1) }} 
        {{ unitmap.length[unitSystem] }}
      </td>
      <td>
        {{ (row.powerConsumption * powerConversion).toFixed(1) }} 
        {{ unitmap.power[unitSystem] }}
      </td>
      <td>\${{ row.price.toFixed(2) }}</td>
      <td>{{ row.availabilityStatus }}</td>
      <td>{{ row.rating.toFixed(1) }}</td>
      <td>
        <button
          class="small"
          (click)="onDelete($event)"
        >
          delete
        </button>
      </td>
  `,
  host: {
    '[class.selected]': 'selected === row.id',
    '(click)': 'onSelect()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RowComponent {
  @Input() row: any;
  @Input() selected: number | null = null;
  @Input() unitSystem: 'metric' | 'imperial' = 'metric';
  @Input() weightConversion: number = 1;
  @Input() lengthConversion: number = 1;
  @Input() powerConversion: number = 1;

  @Output() select = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  unitmap = unitmap;

  onSelect() {
    this.select.emit(this.row.id);
  }

  onDelete(e: Event) {
    e.stopPropagation();
    this.remove.emit(this.row.id);
  }
}
