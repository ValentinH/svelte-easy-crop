import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'y9ik32',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
