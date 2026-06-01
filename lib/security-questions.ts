export const SECURITY_QUESTIONS = [
  "What is your favorite color?",
  "What is your mother's maiden name?",
];

export function getRandomQuestion(): string {
  return SECURITY_QUESTIONS[Math.floor(Math.random() * SECURITY_QUESTIONS.length)];
}
