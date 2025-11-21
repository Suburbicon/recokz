export function formatDateToCustomObject(date: Date) {
  // Extract all components from the Date object
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed, so we add 1
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // Build the final object, converting all number values to strings
  const dateTimeObject = {
    dateTime: {
      date: {
        year: String(year),
        month: String(month),
        day: String(day),
      },
      time: {
        hour: String(hour),
        minute: String(minute),
        second: String(second),
      },
    },
  };

  return dateTimeObject;
}
