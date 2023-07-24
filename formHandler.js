// formHandler.js
import { parseClassData } from './parseClassData.js';
import { parseIndirectClassData } from './parseIndirectClassData.js';
import { generateHTMLTable } from './generateHTMLTable.js';
import { showDialog } from './dialogHandler.js';
import { getState, setState } from './state.js';

export async function handleFormSubmission() {
    // Get checkboxes
    const includeDirectPrerequisites = document.getElementById('includeDirectPrerequisites');
    const includeIndirectPrerequisites = document.getElementById('includeIndirectPrerequisites');

    // Check if at least one checkbox is checked
    if (!includeDirectPrerequisites.checked && !includeIndirectPrerequisites.checked) {
        showDialog('Please select at least one type of prerequisite to include.');
        return;
    }

    // Clear previous class data
    setState({
        classData: null,
        indirectClassData: null
    });

    // Get the already parsed roster data from state
    const rosterData = getState().rosterData;
    console.log('Roster data from state: ', rosterData);

    // Parse the prerequisite data
    let classData = null;
    let indirectClassData = null;
    if (includeDirectPrerequisites.checked) {
        classData = await parseClassData();
        console.log('Parsed class data: ', classData);
    }

    if (includeIndirectPrerequisites.checked) {
        indirectClassData = await parseIndirectClassData();
        console.log('Parsed indirect class data: ', indirectClassData);
    }

    // Set the parsed data into state
    setState({
        rosterData,
        classData,
        indirectClassData
    });

    console.log('Updated state after parsing: ', getState());

    // Generate the HTML table and display it in the output div
    if (rosterData && (classData || indirectClassData)) {
        const htmlTable = await generateHTMLTable(rosterData, classData, indirectClassData);
        document.getElementById('output').innerHTML = htmlTable;

        // Make the output section and download button visible
        // document.getElementById('output').style.display = 'block';
        document.getElementById('tableContainer').style.display = 'block';

        // Scroll the page to the download button
        document.getElementById('downloadBtn').scrollIntoView({ behavior: 'smooth' });
    }
}
