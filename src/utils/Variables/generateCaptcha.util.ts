// utils/captcha.ts
// TODO: use in public suggestion box
export interface MathCaptcha {
  question: string;      // ex: "7 + 3"
  expectedHash: string;  // hashed answer stored securely
}

/**
 * Generate cryptographically strong random math captcha.
 * Supports +, -, × operations for extra security.
 */
export function generateMathCaptcha(): MathCaptcha {
  const a = crypto.getRandomValues(new Uint32Array(1))[0] % 10;
  const b = crypto.getRandomValues(new Uint32Array(1))[0] % 10;

  const operators = ["+", "-", "×"];
  const operator = operators[crypto.getRandomValues(new Uint32Array(1))[0] % operators.length];

  let answer: number;

  switch (operator) {
    case "+":
      answer = a + b;
      break;
    case "-":
      answer = a - b;
      break;
    case "×":
      answer = a * b;
      break;
    default:
      answer = a + b;
  }

  const question = `${a} ${operator} ${b}`;

  // Hash expected answer (prevents exposing solution to user)
  const expectedHash = hashAnswer(answer.toString());

  return { question, expectedHash };
}

/**
 * Secure hash using SHA-256 to avoid exposing raw answer to the client.
 */
export function hashAnswer(answer: string): string {
  if (typeof window !== "undefined") {
    // Browser
    return window.btoa(answer);
  }
  // Node.js (Next.js API routes)
  return Buffer.from(answer).toString("base64");
}

/**
 * Validate captcha on server.
 */
export function validateMathCaptcha(userInput: string, expectedHash: string): boolean {
  return hashAnswer(userInput) === expectedHash;
}
