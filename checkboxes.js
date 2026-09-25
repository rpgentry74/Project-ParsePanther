// checkboxes.js
import {
  handlePrerequisiteReset,
  handleIndirectPrerequisiteReset,
  clearGeneratedOutput,
} from './resetHandler.js';

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
    } else {
      clearGeneratedOutput();
    }
  });

  includeIndirectPrerequisites.addEventListener('change', function () {
    indirectPrerequisiteDataGroup.style.display = this.checked ? 'block' : 'none';

    if (!this.checked) {
      handleIndirectPrerequisiteReset();
    } else {
      clearGeneratedOutput();
    }
  });
}
