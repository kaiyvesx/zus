import { messages as messagesData } from '../data/messages';

let messages = messagesData;
let msgIndex = 0;

/**
 * Get a random message
 */
export const getRandomMessage = () => {
  if (messages.length === 0) return 'Loading...';
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Get next message in sequence (for cycling through messages)
 */
export const getNextMessage = () => {
  if (messages.length === 0) {
    return 'Loading...';
  }
  const message = messages[msgIndex];
  msgIndex = (msgIndex + 1) % messages.length;
  return message;
};

/**
 * Check if messages are loaded
 */
export const areMessagesLoaded = () => {
  return messages.length > 0;
};

/**
 * Get all messages
 */
export const getAllMessages = () => {
  return [...messages];
};

