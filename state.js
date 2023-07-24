let state = {
    rosterData: null,
    classData: null,
    indirectClassData: null,
};

export function resetState() {
    state = {
        rosterData: null,
        classData: null,
        indirectClassData: null,
    };
}

export function getState() {
    return { ...state };
}

export function setState(newState) {
    state = { ...state, ...newState };
}

export function setRosterData(data) {
    state.rosterData = data;
    console.log(state);
}

export function setClassData(data) {
    state.classData = data;
    console.log(state);
}

export function setIndirectClassData(data) {
    state.indirectClassData = data;
    console.log(state);
}