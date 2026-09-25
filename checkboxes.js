// checkboxes.js
import {
  handlePrerequisiteReset,
  handleIndirectPrerequisiteReset,
} from './resetHandler.js';

function invalidateOutput() {
  document.getElementById('output').innerHTML = '';
  document.getElementById('tableContainer').style.display = 'none';
}

export function initializePrerequisiteOptions() {
  const includeDirectPrerequisites = document.getElementById('includeDirectPrerequisites');
  const includeIndirectPrerequisites = document.getElementById('includeIndirectPrerequisites');

  const prerequisiteDataGroup = document.getElementById('prerequisiteDataGroup');
  const indirectPrerequisiteDataGroup = document.getElementById('indirectPrerequisiteDataGroup');

  prerequisiteDataGroup.style.display = includeDirectPrerequisites.checked ? 'block' : 'none';
  indirectPrerequisiteDataGroup.style.display = includeIndirectPrerequisites.checked ? 'block' : 'none';

  includeDirectPrerequisites.addEventListener('change', function () {
    prerequisiteDataGroup.style.display = this.checked ? 'block' : 'none';

    if (!this.checked) {
      handlePrerequisiteReset();
    }

    invalidateOutput();
  });

  includeIndirectPrerequisites.addEventListener('change', function () {
    indirectPrerequisiteDataGroup.style.display = this.checked ? 'block' : 'none';

    if (!this.checked) {
      handleIndirectPrerequisiteReset();
    }

    invalidateOutput();
  });
}
