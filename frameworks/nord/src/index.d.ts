declare module "common/data" {
    export function buildData(count: number): any;
    export const unitmap: {
        weight: { imperial: string; metric: string };
        power: { imperial: string; metric: string };
        length: { imperial: string; metric: string };
    };
}

declare module "common/streaming" {
    export function streamUpdates(update: (row: any) => void): () => void;
}
