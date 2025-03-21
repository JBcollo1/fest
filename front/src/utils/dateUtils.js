import { format, parseISO, isValid } from "date-fns";

/**
 * Format the event date for display.
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted date or "Invalid date".
 */
export const formatEventDate = (dateString) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, "PPP"); // Customize the format as needed
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Format the event time for display.
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted time or an empty string.
 */
export const formatEventTime = (dateString) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "";
    }
    return format(date, "p"); // Customize the format as needed
  } catch (error) {
    return "";
  }
}; 