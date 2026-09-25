// Seeded login credentials, read from .env — never hardcoded in source.
// One-time setup: cp .env.example .env
//
// (.env.example's values match the seeded demo accounts documented in the
// README's "Seeded logins" table.)
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file — required() below throws with a clear, actionable message.
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — copy .env.example to .env before running the e2e suite.`);
  }
  return value;
}

export interface SeededUser {
  email: string;
  password: string;
}

export const SEEDED_USERS: Record<'admin' | 'accountant', SeededUser> = {
  admin: {
    email: required('QA_ADMIN_EMAIL'),
    password: required('QA_ADMIN_PASSWORD'),
  },
  accountant: {
    email: required('QA_ACCOUNTANT_EMAIL'),
    password: required('QA_ACCOUNTANT_PASSWORD'),
  },
};

export type SeededRole = keyof typeof SEEDED_USERS;
