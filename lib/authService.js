export const authStorageKey = "fitivo-demo-authenticated";

// Temporary demo sign-in only. Replace this credential check with a real API call when authentication is available.
export function signIn(email, password) {
  const demoEmail = "admin@fitivo.com";
  const demoPassword = "FitivoDemo123";
  if (email.trim().toLowerCase() !== demoEmail || password !== demoPassword) {
    return { success: false, message: "The email or password is incorrect." };
  }

  try {
    window.localStorage.setItem(authStorageKey, "true");
    return { success: true };
  } catch {
    return { success: false, message: "Sign-in could not be saved in this browser. Check your browser storage settings and try again." };
  }
}
