// state.js
function createInitialState() {
  return {
    rosterData: null,
    directPrerequisiteData: null,
    indirectPrerequisiteData: null,
  };
}

let state = createInitialState();

export function resetState() {
  state = createInitialState();
}

export function getState() {
  return { ...state };
}

export function setState(newState) {
  state = { ...state, ...newState };
}

export function setRosterData(data) {
  state.rosterData = data;
}

export function setDirectPrerequisiteData(data) {
  state.directPrerequisiteData = data;
}

export function setIndirectPrerequisiteData(data) {
  state.indirectPrerequisiteData = data;
}
