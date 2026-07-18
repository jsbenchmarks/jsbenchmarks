import { derived } from "@grainular/grains";
import { $each, $if, html, on } from "@grainular/nord";
import "common/main.css";
import { Row } from "./row";
import { benchmark } from "./state";

const { actions, state } = benchmark;

export const App = () => {
    return html`
        <main>
            <div class="header">
                <h1>Nørd</h1>
                <div class="actions">
                    <button id="create" disabled="${state.isStreaming}" ${on("click", actions.create)}>Create</button>
                    <button id="stream" ${on("click", actions.stream)}>
                        ${derived(state.isStreaming, (isStreaming) => (isStreaming ? "Stop" : "Stream"))}
                    </button>
                    <button id="reverse" disabled="${state.isStreaming}" ${on("click", actions.reverseRows)}>
                        Reverse
                    </button>
                    <button id="insert" disabled="${state.isStreaming}" ${on("click", actions.insertRow)}>
                        Insert
                    </button>
                    <button id="prepend" disabled="${state.isStreaming}" ${on("click", actions.prependRow)}>
                        Prepend
                    </button>
                    <button id="append" disabled="${state.isStreaming}" ${on("click", actions.appendRow)}>
                        Append
                    </button>
                    <button id="sort" disabled="${state.isStreaming}" ${on("click", actions.sortRows)}>Sort</button>
                    <button id="filter" disabled="${state.isStreaming}" ${on("click", actions.filterRows)}>
                        Filter
                    </button>
                    <button id="units" disabled="${state.isStreaming}" ${on("click", actions.toggleUnitSystem)}>
                        Units
                    </button>
                    <button id="restock" disabled="${state.isStreaming}" ${on("click", actions.restockRows)}>
                        Restock
                    </button>
                    <button id="clear" disabled="${state.isStreaming}" ${on("click", actions.clear)}>Clear</button>
                </div>
            </div>

            ${$if(derived(state.rows, (rows) => !!rows.length))
                .$then(
                    () => html`
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
                                ${$each(state.rows).$withKey((row) => row.id).$as(Row)}
                            </tbody>
                        </table>
                    `,
                )
                .$else(() => html`<h2 class="text-center">No rows to show</h2> `)}
        </main>
    `;
};
