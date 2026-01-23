import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buildData } from 'common/data';
import { RowComponent } from './row.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RowComponent],
  template: `
    <main>
      <div class="header">
        <h1>Angular</h1>
        <div class="actions">
          <button id="create" (click)="create()">Create</button>
          <button id="reverse" (click)="reverse()">Reverse</button>
          <button id="insert" (click)="insert()">Insert</button>
          <button id="prepend" (click)="prepend()">Prepend</button>
          <button id="append" (click)="append()">Append</button>
          <button id="sort" (click)="sort()">Sort</button>
          <button id="filter" (click)="filter()">Filter</button>
          <button id="units" (click)="toggleUnits()">Units</button>
          <button id="restock" (click)="restock()">Restock</button>
          <button id="clear" (click)="clear()">Clear</button>
        </div>
      </div>

      @if (rows().length) {
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>name</th>
              <th>weight</th>
              <th>dimensions</th>
              <th>power consumption</th>
              <th>price</th>
              <th>availability status</th>
              <th>rating</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr app-row
                [row]="row"
                [selected]="selected()"
                [unitSystem]="unitSystem()"
                [weightConversion]="weightConversion()"
                [lengthConversion]="lengthConversion()"
                [powerConversion]="powerConversion()"
                (select)="selected.set($event)"
                (remove)="deleteRow($event)"
              ></tr>
            }
          </tbody>
        </table>
      } @else {
        <h2 class="text-center">No rows to show</h2>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  rows = signal<any[]>([]);
  selected = signal<number | null>(null);
  unitSystem = signal<'metric' | 'imperial'>('metric');

  weightConversion = computed(() => (this.unitSystem() === 'metric' ? 1 : 2.20462));
  powerConversion = computed(() => (this.unitSystem() === 'metric' ? 1 : 0.00134102));
  lengthConversion = computed(() => (this.unitSystem() === 'metric' ? 1 : 0.393701));

  create() {
    this.rows.set(buildData(1000));
  }

  reverse() {
    this.rows.update(rows => [...rows].reverse());
  }

  insert() {
    this.rows.update(rows => [...rows.slice(0, 10), ...buildData(1), ...rows.slice(10)]);
  }

  prepend() {
    this.rows.update(rows => [...buildData(1), ...rows]);
  }

  append() {
    this.rows.update(rows => [...rows, ...buildData(1)]);
  }

  sort() {
    this.rows.update(rows => [...rows].sort((a, b) => a.name.localeCompare(b.name)));
  }

  filter() {
    this.rows.update(rows => rows.filter(d => d.id % 2));
  }

  toggleUnits() {
    this.unitSystem.update(u => u === 'imperial' ? 'metric' : 'imperial');
  }

  restock() {
    this.rows.update(rows => rows.map(r => r.availabilityStatus === "Out of Stock" ? { ...r, availabilityStatus: "In Stock" } : r));
  }

  clear() {
    this.rows.set([]);
  }

  deleteRow(id: number) {
    this.rows.update(rows => rows.filter(r => r.id !== id));
  }
}
