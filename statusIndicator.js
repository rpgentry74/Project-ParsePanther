//statusIndicator.js
export function updateStatusIndicator(elementId, message, statusType) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = ""; // Reset class
    element.classList.add("status-indicator"); // Always apply the base class
  
    // Apply the appropriate class for the status type
    switch (statusType) {
      case "good":
        element.classList.add("status-good");
        break;
      case "bad":
        element.classList.add("status-bad");
        break;
      case "default":
      default:
        element.classList.add("status-default");
        break;
    }
  }
  