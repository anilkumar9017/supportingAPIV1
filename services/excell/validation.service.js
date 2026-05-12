const moment = require('moment');


/* 
    * Validate date string, date instance, number
*/
function validateDate({ value, col, rowNumber, errors }) {
  if (col.type !== "date" || !value) {
    return value;
  }

  /*
    DATE OBJECT
  */
  if (value instanceof Date) {
    return moment(value).toDate();
  }

  /*
    EXCEL SERIAL NUMBER
  */

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);

    excelEpoch.setDate(excelEpoch.getDate() + value);

    return moment(excelEpoch).toDate();
  }

  /*
    STRING DATE
    */

  if (typeof value === "string") {
    const parsedDate = moment(
      value,
      ["YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY", "DD/MM/YYYY"],
      true
    );

    if (parsedDate.isValid()) {
      return parsedDate.toDate();
    }
  }

  errors.push({
    row: rowNumber,
    column: col.header,
    message: "Invalid date format.",
  });

  return null;
}

/* 
    * Validate required field
*/
function validateRequired({ value, col, rowNumber, errors }) {
  if (col.required && (value === null || value === undefined || value === "")) {
    errors.push({
      row: rowNumber,
      column: col.header,
      message: `${col.header} is required.`,
    });
  }
}


/* 
    * validate checkbox
*/
function validateCheckbox({ value, col, rowNumber, errors }) {
  if (col.type === "checkbox" && value) {
    if (!col.values.includes(value)) {
      errors.push({
        row: rowNumber,
        column: col.header,
        message: `Invalid value '${value}'.`,
      });
    }
  }
}

/* 
    Validate Duplicate in excell
*/
function validateDuplicateExcel({ duplicateSet, value, rowNumber, errors }) {
  if (duplicateSet.has(value)) {
    errors.push({
      row: rowNumber,
      message: `Duplicate value '${value}' in Excel.`,
    });

    return;
  }

  duplicateSet.add(value);
}

/* return dropdown value */
function mappedDropdown({value, col, rowNumber, errors}, dropdownMappings) {
    if (value == null || value === "") return null;

    // Normalize value as string to match mapping keys
    //value = String(value)?.trim();

    const mappedValue = dropdownMappings?.[col.key]?.[value];
    console.log("mappedValue ", col.key, mappedValue, value);
    if (!mappedValue) {
        /* errors.push({
            row: rowNumber,
            column: col.header,
            message: `Invalid value '${value}' for ${col.header}`
        });
        return null; */
        return value;
    }

    return mappedValue; // ID → ID (or keep as string if DB allows)
}


module.exports = {
    validateDate,
    validateRequired,
    validateCheckbox,
    validateDuplicateExcel,
    mappedDropdown
};