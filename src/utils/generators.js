// Combined generator utilities
import { generateBothNames, areNamesLoaded } from './nameGenerator';
import { getNextMessage, areMessagesLoaded } from './messageGenerator';

/**
 * Generate all form data (names and message)
 */
export const generateAll = () => {
  if (!areNamesLoaded() || !areMessagesLoaded()) {
    return {
      error: 'Libraries still loading...',
    };
  }

  const names = generateBothNames();
  const message = getNextMessage();

  return {
    senderName: names.senderName,
    recipientName: names.recipientName,
    message: message,
  };
};

/**
 * Generate email address
 */
export const generateEmail = () => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com'];
  const randomString = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  return `${randomString}@${randomDomain}`;
};

/**
 * Generate date of birth (18+ years old only)
 */
export const generateDOB = () => {
  const today = new Date();
  const maxAge = 65; // Maximum age
  const minAge = 18; // Minimum age (18+)

  // Calculate date range: between 18 and 65 years ago
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  // Generate random date between minDate and maxDate
  const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
  const randomDate = new Date(randomTime);

  // Format as YYYY-MM-DD for date input
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Re-export name and message generators
export { getRandomFirstName, getRandomLastName, getRandomFullName, getNextFullName, generateBothNames, areNamesLoaded } from './nameGenerator';
export { getRandomMessage, getNextMessage, areMessagesLoaded } from './messageGenerator';

