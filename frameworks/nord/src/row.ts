import { derived, type WritableGrain } from "@grainular/grains";
import { createDirective, html, on } from "@grainular/nord";
import { benchmark } from "./state";

const { state, actions } = benchmark;

export type AvailabilityStatus = "Low Stock" | "In Stock" | "Out of Stock";
export type Dimensions = { width: number; height: number; depth: number };

export type Row = {
    id: number;
    name: string;
    dimensions: Dimensions;
    powerConsumption: number;
    rating: number;
    weight: number;
    price: number;
    availabilityStatus: AvailabilityStatus;
};

export type RowProps = Omit<Row, "availabilityStatus" | "price"> & {
    price: WritableGrain<number>;
    availabilityStatus: WritableGrain<AvailabilityStatus>;
};

// Custom directive to set the class dynamically
const isRowSelected = (rowId: number) => {
    return createDirective((node) => {
        return state.selectedId.subscribe((id) => {
            node.classList.toggle("selected", rowId === id);
        });
    });
};

export const Row = (props: RowProps) => {
    return html`
        <tr ${isRowSelected(props.id)} ${on("click", () => !state.isStreaming() && actions.setSelectedId(props.id))}>
            <td>${props.id}</td>
            <td>${props.name}</td>

            <td>${derived(state.unitSystem, actions.calculateWeight(props))}</td>
            <td>${derived(state.unitSystem, actions.calculateDimensions(props))}</td>
            <td>${derived(state.unitSystem, actions.calculatePowerConsumption(props))}</td>

            <td>${derived(props.price, (price) => price.toFixed(2))}</td>
            <td>${props.availabilityStatus}</td>
            <td>${props.rating.toFixed(1)}</td>
            <td>
                <button class="small" disabled="${state.isStreaming}" ${on("click", () => actions.deleteRow(props.id))}>
                    delete
                </button>
            </td>
        </tr>
    `;
};
