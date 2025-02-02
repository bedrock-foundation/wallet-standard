/** @internal */
export const EMPTY_STRING = '' as const;

/** @internal */
export const EMPTY_ARRAY = [] as const;

/** @internal */
export function createDefaultContext<V, T extends Record<string, V>>(name: string, defaultState: T): T {
    for (const property of Object.keys(defaultState)) {
        const value = defaultState[property];
        Object.defineProperty(defaultState, property, {
            get(): V {
                console.error(
                    'You have tried to access `' +
                        property +
                        '` on a ' +
                        name +
                        'Context without providing one. ' +
                        'Make sure to render a ' +
                        name +
                        'Provider as an ancestor of the component that calls `use' +
                        name +
                        '`.'
                );
                return value;
            },
        });
    }
    return defaultState;
}
