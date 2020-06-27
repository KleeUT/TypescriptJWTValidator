import { isTokenValid } from "./tokenValidator";
const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFUWkJPVVpDUlRoR05rTTROVVl5UVRCQk1qZ3hSVFEyUTBORU9UQXdNVEl5UlRGQ1F6RkRSUSJ9.eyJpc3MiOiJodHRwczovL2tsZWUtdGVzdC5hdS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWVlNDY4ZWJlZjdjYWMwMDE5ZjJhZTM2IiwiYXVkIjpbIlRoZVN3ZWV0ZXN0QVBJIiwiaHR0cHM6Ly9rbGVlLXRlc3QuYXUuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTU5MjIyMTE2NCwiZXhwIjoxNTkyMzA3NTY0LCJhenAiOiJ3d2s0Z3psT0pFTnhTZDk3elp0YnN4SnA1cVFxNG9JMyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.eRxceHJ1AQajJxVtah4PpHYkjC_LN9Bt29m3xRd6tw9qr-ErV4FZ5W0ZOEY_KNAWeE4E9k7eYUH7Clt7PohqSwRHA5CMZ4N_m0nzoGH9Yl9gL0g-YlOyrBXaSJBUKBoxfK2uW1-nwL3bl1u5uOIaT_KX8tsFGlBFhbBSt1VomnxAxYa3pLO3OPSVsM4AyYJXjEsizmu1VbAwbijCzf3hVozgiVEGy_uyaVqc9x8f9iEKF0-PwkKefLZtjOydyuFL8sJVqXMWJPuoBRZ2EAtTBPhteMkZTEXa4N_vdcFDc6kUxLDAwFmioFD3kFMlm4lQGPRTJ3Lfmy8Ctt-qENUJjQ";
const jwksEndpoint = "https://klee-test.au.auth0.com/.well-known/jwks.json";

describe(isTokenValid, () => {
  it("Should validate my token", async () => {
    // In an normal application you'd mock out fetch here, or better yet pass it into the function but for this example the test is going out to the real endpoint
    expect(await isTokenValid(token, jwksEndpoint)).toBe(true);
  });
});
