import { EntitlementError, entitlementErrorResponse } from "./entitlements.js";

export function enforceRouteFeature(request, context) {
  const url = new URL(request.url);
  const path = url.pathname;
  let feature;
  if (path.startsWith("/api/members")) feature = "memberManagement";
  else if (path.startsWith("/api/plans") || path.startsWith("/api/subscriptions")) feature = "membershipPlans";
  else if (path.startsWith("/api/attendance")) feature = "attendance";
  else if (path.startsWith("/api/payments")) feature = "memberPayments";
  else if (path.startsWith("/api/dashboard")) feature = "basicDashboard";
  else if (path === "/api/reports") feature = url.searchParams.get("basic") === "1" ? "basicReports" : "advancedAnalytics";
  else if (path === "/api/exports") feature = "csvExports";
  else if (path === "/api/payment-reports") feature = "advancedPaymentReports";
  if (feature && context.entitlements.features[feature] !== true) return entitlementErrorResponse(new EntitlementError("This feature is unavailable on your plan. Visit Plan & billing to request an upgrade.", "FEATURE_UNAVAILABLE", 403, { feature }));
  return null;
}
