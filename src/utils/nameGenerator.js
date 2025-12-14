import { firstNames as firstNamesData, lastNames as lastNamesData } from '../data/names';

let firstNames = firstNamesData;
let lastNames = lastNamesData;
let nameIndex = 0;

/**
 * Get a random first name
 */
export const getRandomFirstName = () => {
  if (firstNames.length === 0) return 'Loading...';
  return firstNames[Math.floor(Math.random() * firstNames.length)];
};

/**
 * Get a random last name
 */
export const getRandomLastName = () => {
  if (lastNames.length === 0) return 'Loading...';
  return lastNames[Math.floor(Math.random() * lastNames.length)];
};

/**
 * Get a random full name
 */
export const getRandomFullName = () => {
  if (firstNames.length === 0 || lastNames.length === 0) return 'Loading...';
  return `${getRandomFirstName()} ${getRandomLastName()}`;
};

/**
 * Get next full name in sequence (for cycling through names)
 */
export const getNextFullName = () => {
  if (firstNames.length === 0 || lastNames.length === 0) {
    return 'Loading...';
  }
  const f = firstNames[nameIndex % firstNames.length];
  const l = lastNames[nameIndex % lastNames.length];
  nameIndex = (nameIndex + 1) % Math.max(firstNames.length, lastNames.length);
  return `${f} ${l}`;
};

/**
 * Generate both sender and recipient names
 */
export const generateBothNames = () => {
  return {
    senderName: getNextFullName(),
    recipientName: getNextFullName(),
  };
};

/**
 * Check if names are loaded
 */
export const areNamesLoaded = () => {
  return firstNames.length > 0 && lastNames.length > 0;
};

/**
 * Get all first names
 */
export const getAllFirstNames = () => {
  return [...firstNames];
};

/**
 * Get all last names
 */
export const getAllLastNames = () => {
  return [...lastNames];
};

