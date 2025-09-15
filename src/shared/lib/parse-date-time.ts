/**
 * Parses various date and time formats and returns a dayjs object with timezone support
 * for use in Next.js server actions
 *
 * @param date - Date in format '27.08.2024 20:22', '27.08.2024', or Excel serial number (e.g. 45529.490694444445)
 * @param time - Optional time in format '19:59:16'
 * @param timezone - Optional timezone string (e.g. 'Europe/Berlin', 'America/New_York')
 *                   Defaults to 'UTC' if not provided
 * @returns dayjs object (can convert to native Date with .toDate())
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export function parseDateTime(
  date: string | number,
  time?: string,
  timezone: string = "UTC",
): dayjs.Dayjs | undefined {
  let result: dayjs.Dayjs | undefined;

  // Case 1: Excel serial number
  if (typeof date === "number") {
    // Excel dates are days since December 31, 1899
    const excelEpoch = dayjs.utc("1899-12-30");
    const millisecondsInDay = 24 * 60 * 60 * 1000;

    // Convert Excel date (days since epoch) to milliseconds
    const millisecondsSinceEpoch = date * millisecondsInDay;

    // Create the date with timezone awareness
    result = dayjs(excelEpoch.valueOf() + millisecondsSinceEpoch).tz(timezone);
  } else {
    // Case 2 & 3: String formats
    let dateStr = date.trim();
    let timeStr = time?.trim() || "";

    // Check if date already includes time
    if (dateStr.includes(" ")) {
      const [datePart, timePart] = dateStr.split(" ");

      if (hasLetters(datePart)) {
        return;
      }

      dateStr = datePart;
      // Only use the time from date if the time parameter wasn't provided
      if (!timeStr) {
        timeStr = timePart;
      }
    }
    // Parse the date part (DD.MM.YYYY)
    // Parse with explicit format to ensure DD.MM.YYYY interpretation
    const possibleFormats = [
      "YYYY-MM-DD",
      "DD-MM-YYYY",
      "YYYY.MM.DD",
      "DD.MM.YYYY",
      "DD/MM/YYYY",
      "YYYY/MM/DD",
      "M/D/YYYY", // Форматы без ведущих нулей
      "D.M.YYYY"
    ];
    const parsedDate = dayjs(dateStr, possibleFormats, true).tz(timezone);
    if (!parsedDate.isValid()) {
      console.error("Invalid date format:", dateStr);
      return;
    }

    dateStr = parsedDate.format("DD.MM.YYYY");
    const [day, month, year] = dateStr
      .split(".")
      .map((part) => parseInt(part, 10));

    // Parse time if available
    let hours = 0,
      minutes = 0,
      seconds = 0;
    if (timeStr) {
      const timeParts = timeStr.split(":").map((part) => parseInt(part, 10));
      hours = timeParts[0] || 0;
      minutes = timeParts[1] || 0;
      seconds = timeParts[2] || 0;
    }

    // Format into ISO string for consistent parsing
    const monthString = (month < 10 ? "0" : "") + month;
    const dayString = (day < 10 ? "0" : "") + day;

    // Create date string in YYYY-MM-DD format as expected by dayjs
    const isoDate = `${year < 100 ? year + 2000 : year}-${monthString}-${dayString}`;
    const isoTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Create the date with timezone awareness
    try {
      result = dayjs.tz(`${isoDate}T${isoTime}`, timezone);
    } catch (e) {
      // console.error("failed convert date in parse-date-time", e);
    }
  }

  return result;
}

/**
 * Check if two dates match based on year, month, and day (ignoring time)
 * Works with both dayjs objects and native Date objects
 *
 * @param date1 - First date (dayjs object or native Date)
 * @param date2 - Second date (dayjs object or native Date)
 * @returns boolean - True if the dates match by year, month, and day
 */
export function areSameDate(
  date1: dayjs.Dayjs | Date,
  date2: dayjs.Dayjs | Date,
): boolean {
  // Always convert both dates to UTC for a reliable comparison
  const day1 = dayjs(date1);
  const day2 = dayjs(date2);

  // Compare year, month, and day in UTC
  return (
    day1.year() === day2.year() &&
    day1.month() === day2.month() &&
    day1.date() === day2.date()
  );
}

function hasLetters(str: string) {
  return /\p{L}/u.test(str);
}
