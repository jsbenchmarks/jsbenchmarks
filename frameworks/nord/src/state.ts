import { grain, readonly } from "@grainular/grains";
import { buildData as buildRowData, unitmap } from "common/data";
import { streamUpdates } from "common/streaming";
import type { Dimensions, Row, RowProps } from "./row";

const rows = grain<RowProps[]>([]);

export const buildData = (count: number): RowProps[] => {
    return buildRowData(count).map((data: Row) => ({
        ...data,
        price: grain(data.price),
        availabilityStatus: grain(data.availabilityStatus),
    }));
};

const deleteRow = (id: number) => {
    rows.update((current) => {
        return current.filter((row) => row.id !== id);
    });
};

const reverseRows = () => {
    rows.update((current) => {
        return current.toReversed();
    });
};

const insertRow = () => {
    rows.update((current) => {
        return [...current.slice(0, 10), ...buildData(1), ...current.slice(10)];
    });
};

const prependRow = () => {
    rows.update((current) => {
        return [...buildData(1), ...current];
    });
};

const appendRow = () => {
    rows.update((current) => {
        return [...current, ...buildData(1)];
    });
};

const sortRows = () => {
    rows.update((current) => {
        return current.toSorted((a, b) => a.name.localeCompare(b.name));
    });
};
const filterRows = () => {
    rows.update((current) => {
        return current.filter((d) => d.id % 2);
    });
};

const restockRows = () => {
    rows().forEach((row) => {
        row.availabilityStatus() === "Out of Stock" && row.availabilityStatus.set("In Stock");
    });
};

const selectedId = grain<number | null>(null);
const setSelectedId = (value: number | null) => selectedId.set(value);

const unitSystem = grain<"metric" | "imperial">("metric");
const toggleUnitSystem = () => {
    unitSystem.set(unitSystem() === "metric" ? "imperial" : "metric");
};

let stopStreaming: (() => void) | null = null;
const isStreaming = grain(false);
const setIsStreaming = (value: boolean) => isStreaming.set(value);

const create = () => {
    if (stopStreaming) {
        stopStreaming();
        stopStreaming = null;
        setIsStreaming(false);
    }

    rows.set(buildData(1000));
};

const stream = () => {
    if (stopStreaming) {
        stopStreaming();
        stopStreaming = null;
        setIsStreaming(false);
        return;
    }

    const initialRows = buildData(25);
    setIsStreaming(true);
    rows.set(initialRows);

    const mappedRows = new Map<number, RowProps>(initialRows.map((row) => [row.id, row]));
    stopStreaming = streamUpdates((update: Row) => {
        const row = mappedRows.get(update.id);
        if (row) {
            if (update.price) row.price.set(update.price);
            if (update.availabilityStatus) row.availabilityStatus.set(update.availabilityStatus);
        }
    });
};

const clear = () => {
    if (stopStreaming) {
        stopStreaming();
        stopStreaming = null;
        setIsStreaming(false);
    }
    rows.set([]);
};

const calculatePowerConsumption = ({ powerConsumption }: { powerConsumption: number }) => {
    return (system: "metric" | "imperial") => {
        return `${(powerConsumption * (system === "metric" ? 1 : 0.00134102)).toFixed(1)} ${unitmap.power[system]}`;
    };
};

const calculateWeight = ({ weight }: { weight: number }) => {
    return (system: "metric" | "imperial") => {
        return `${(weight * (system === "metric" ? 1 : 2.20462)).toFixed(1)} ${unitmap.weight[system]}`;
    };
};

const calculateDimensions = ({ dimensions }: { dimensions: Dimensions }) => {
    const { width, height, depth } = dimensions;
    return (system: "metric" | "imperial") => {
        const convertLength = (length: number) => ((system === "metric" ? 1 : 0.393701) * length).toFixed(1);
        return `${convertLength(height)} x ${convertLength(width)} x ${convertLength(depth)} ${unitmap.length[system]}`;
    };
};

export const benchmark = {
    state: {
        isStreaming: readonly(isStreaming),
        rows: readonly(rows),
        selectedId: readonly(selectedId),
        unitSystem: readonly(unitSystem),
    },
    actions: {
        setIsStreaming,
        setSelectedId,
        toggleUnitSystem,
        calculateWeight,
        calculateDimensions,
        calculatePowerConsumption,
        deleteRow,
        reverseRows,
        restockRows,
        insertRow,
        prependRow,
        appendRow,
        sortRows,
        filterRows,
        create,
        stream,
        clear,
    },
};
