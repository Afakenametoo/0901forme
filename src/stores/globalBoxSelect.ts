// globalBoxSelect.ts
let removeBoxSelect: (() => void) | null = null;

export const setRemoveBoxSelect = (func: () => void) => {
    removeBoxSelect = func;
};

export const callRemoveBoxSelect = () => {
    if (removeBoxSelect) {
        removeBoxSelect();
    } else {
        console.warn('Box select remove function is not set.');
    }
};
