// Browser-only component harness: record redirects without entering protected pages.
export function useRouter() {
  return {
    replace(path) { window.__authRedirect = path; },
    refresh() { window.__authRefreshed = true; },
  };
}
