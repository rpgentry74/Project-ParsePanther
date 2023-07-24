window.addEventListener('DOMContentLoaded', (event) => {
    const includeDirectPrerequisites = document.getElementById("includeDirectPrerequisites");
    const includeIndirectPrerequisites = document.getElementById("includeIndirectPrerequisites");
  
    const prerequisiteData = document.getElementById("prerequisiteData");
    const indirectPrerequisiteData = document.getElementById("indirectPrerequisiteData");
  
    const prerequisiteDataGroup = document.getElementById("prerequisiteDataGroup");
    const indirectPrerequisiteDataGroup = document.getElementById("indirectPrerequisiteDataGroup");
  
    // Test for removal *** const resetPrerequisite = document.getElementById('resetPrerequisite');
    // Test for removal *** const resetIndirectPrerequisite = document.getElementById('resetIndirectPrerequisite');
  
    // Check the initial state of includeDirectPrerequisites checkbox
    prerequisiteDataGroup.style.display = includeDirectPrerequisites.checked ? 'block' : 'none';
    
    // Check the initial state of includeIndirectPrerequisites checkbox
    indirectPrerequisiteDataGroup.style.display = includeIndirectPrerequisites.checked ? 'block' : 'none';
  
    includeDirectPrerequisites.addEventListener("change", function() {
      prerequisiteDataGroup.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) prerequisiteData.value = ""; // Clear the textbox
    });
  
    includeIndirectPrerequisites.addEventListener("change", function() {
      indirectPrerequisiteDataGroup.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) indirectPrerequisiteData.value = ""; // Clear the textbox
    });
  });
  