/**
 * @file calendar.js
 * @description Provides functions for calendar management, including getting a calendar instance.
 * This module is designed to be imported into other parts of the application.
 */

/**
 * Represents a basic calendar instance.
 * In a real application, this would likely interact with a date library
 * or a more complex calendar data structure.
 */
class CalendarInstance {
  /**
   * Constructs a new CalendarInstance.
   * @param {Date} [initialDate=new Date()] - The initial date for the calendar.
   */
  constructor(initialDate = new Date()) {
    this.currentDate = initialDate;
    console.log(`Calendar instance created for date: ${this.currentDate.toDateString()}`);
  }

  /**
   * Gets the current date of the calendar instance.
   * @returns {Date} The current date.
   */
  getCurrentDate() {
    return this.currentDate;
  }

  /**
   * Sets the current date of the calendar instance.
   * @param {Date} newDate - The new date to set.
   */
  setCurrentDate(newDate) {
    if (newDate instanceof Date && !isNaN(newDate)) {
      this.currentDate = newDate;
      console.log(`Calendar date set to: ${this.currentDate.toDateString()}`);
    } else {
      console.error("Invalid date provided to setCurrentDate.");
    }
  }

  /**
   * Navigates the calendar to the next month.
   * @returns {Date} The new current date.
   */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    console.log(`Navigated to next month: ${this.currentDate.toDateString()}`);
    return this.currentDate;
  }

  /**
   * Navigates the calendar to the previous month.
   * @returns {Date} The new current date.
   */
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    console.log(`Navigated to previous month: ${this.currentDate.toDateString()}`);
    return this.currentDate;
  }

  // You can add more calendar-specific methods here,
  // e.g., getDaysInMonth, getEventsForDate, etc.
}

/**
 * Provides a singleton-like instance of the Calendar.
 * This function is exported and can be imported by other modules.
 * @returns {CalendarInstance} A new instance of the CalendarInstance class.
 */
export function getCalendarInstance() {
  // In a more complex scenario, you might want to ensure only one instance
  // exists (singleton pattern) or manage multiple instances based on a key.
  // For simplicity, this returns a new instance each time it's called.
  console.log("Requesting a new calendar instance.");
  return new CalendarInstance();
}

// Example of another named export (optional)
export const CALENDAR_VERSION = "1.0.0";

// Example of a default export (optional, if you prefer to export the class directly)
// export default CalendarInstance;