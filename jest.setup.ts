import '@testing-library/jest-dom'

// Polyfill fetch for Node.js environment
global.fetch = jest.fn()

// Mock Firebase
jest.mock('@/firebase/firebasefrontend', () => ({
  auth: {
    currentUser: null,
  },
  storage: {},
  googleProvider: {},
  githubProvider: {},
}))

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  signInWithPopup: jest.fn(() => Promise.resolve()),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
