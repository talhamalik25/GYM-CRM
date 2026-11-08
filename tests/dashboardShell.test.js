import test from "node:test";
import assert from "node:assert/strict";
import {
  nav,
  adminNav,
  trainerNav,
  isActive,
  getPageTitle,
  getRoleName,
  getHomeHref,
  getProfileHref,
  getNavLinks,
  getAccountLinks,
} from "../lib/dashboardNavRules.js";

test("nav lists contain required groups and strictly valid routes", () => {
  assert.ok(nav.length >= 8);
  assert.ok(adminNav.length >= 4);
  assert.ok(trainerNav.length >= 1);

  for (const item of nav) {
    assert.ok(item.label);
    assert.ok(item.href.startsWith("/"));
    assert.ok(["Overview", "Management", "Finance", "Workspace"].includes(item.group));
    assert.ok(item.Icon);
  }
});

test("role name mapping produces correct labels", () => {
  assert.equal(getRoleName({ isSuperadmin: true }), "Super Admin");
  assert.equal(getRoleName({ isTrainer: true }), "Trainer");
  assert.equal(getRoleName({ canManageStaff: true }), "Gym Owner");
  assert.equal(getRoleName({ isGymAdmin: true }), "Gym Admin");
  assert.equal(getRoleName({}), "Staff");
});

test("home href maps appropriately per role", () => {
  assert.equal(getHomeHref({ isSuperadmin: true }), "/admin");
  assert.equal(getHomeHref({ isTrainer: true }), "/trainer");
  assert.equal(getHomeHref({ canManageStaff: true }), "/dashboard");
  assert.equal(getHomeHref({}), "/dashboard");
});

test("profile href maps appropriately per role", () => {
  assert.equal(getProfileHref({ isSuperadmin: true }), "/admin/users");
  assert.equal(getProfileHref({ isTrainer: true }), "/trainer");
  assert.equal(getProfileHref({ canManageStaff: true }), "/profile");
  assert.equal(getProfileHref({}), "/dashboard");
});

test("owner navigation includes staff, billing, and settings", () => {
  const links = getNavLinks({ canManageStaff: true });
  const hrefs = links.map(({ href }) => href);

  assert.ok(hrefs.includes("/dashboard"));
  assert.ok(hrefs.includes("/members"));
  assert.ok(hrefs.includes("/memberships"));
  assert.ok(hrefs.includes("/attendance"));
  assert.ok(hrefs.includes("/trainers"));
  assert.ok(hrefs.includes("/staff"));
  assert.ok(hrefs.includes("/payments"));
  assert.ok(hrefs.includes("/reports"));
  assert.ok(hrefs.includes("/billing"));
  assert.ok(hrefs.includes("/settings"));
  assert.equal(links.length, 10);
});

test("gym admin and staff navigation omit owner-only links", () => {
  const staffLinks = getNavLinks({ canManageStaff: false, isGymAdmin: false });
  const staffHrefs = staffLinks.map(({ href }) => href);

  assert.ok(!staffHrefs.includes("/staff"));
  assert.ok(!staffHrefs.includes("/billing"));
  assert.ok(!staffHrefs.includes("/settings"));
  assert.ok(staffHrefs.includes("/dashboard"));
  assert.ok(staffHrefs.includes("/members"));
  assert.ok(staffHrefs.includes("/attendance"));
  assert.ok(staffHrefs.includes("/payments"));
  assert.ok(staffHrefs.includes("/reports"));

  const adminLinks = getNavLinks({ canManageStaff: false, isGymAdmin: true });
  assert.deepEqual(staffLinks, adminLinks);
});

test("trainer navigation uses dedicated trainerNav", () => {
  const trainerLinks = getNavLinks({ isTrainer: true });
  assert.equal(trainerLinks.length, 1);
  assert.equal(trainerLinks[0].href, "/trainer");
  assert.equal(trainerLinks[0].label, "Trainer workspace");
});

test("superadmin navigation uses dedicated adminNav", () => {
  const adminLinks = getNavLinks({ isSuperadmin: true });
  const hrefs = adminLinks.map(({ href }) => href);
  assert.deepEqual(hrefs, ["/admin", "/admin/gyms", "/admin/users", "/admin/billing"]);
});

test("account links reflect role permissions", () => {
  const ownerLinks = getAccountLinks({ canManageStaff: true });
  assert.deepEqual(ownerLinks, [
    { href: "/profile", label: "My Profile" },
    { href: "/settings", label: "Account Settings" },
  ]);

  const superadminLinks = getAccountLinks({ isSuperadmin: true });
  assert.equal(superadminLinks.length, 4);

  const staffLinks = getAccountLinks({});
  assert.deepEqual(staffLinks, []);
});

test("isActive highlights exact and nested routes accurately", () => {
  assert.equal(isActive("/dashboard", "/dashboard"), true);
  assert.equal(isActive("/members", "/members"), true);
  assert.equal(isActive("/members/123", "/members"), true);
  assert.equal(isActive("/members/new", "/members"), true);
  assert.equal(isActive("/memberships/plans/123", "/memberships"), true);

  // Cross-route false matches
  assert.equal(isActive("/membership", "/members"), false);
  assert.equal(isActive("/billing", "/members"), false);

  // Admin isolation
  assert.equal(isActive("/admin", "/admin"), true);
  assert.equal(isActive("/admin/gyms", "/admin"), false);
  assert.equal(isActive("/admin/gyms", "/admin/gyms"), true);
  assert.equal(isActive("/admin/gyms/123", "/admin/gyms"), true);
});

test("getPageTitle resolves labels for known and nested pages", () => {
  assert.equal(getPageTitle("/dashboard"), "Dashboard");
  assert.equal(getPageTitle("/members"), "Members");
  assert.equal(getPageTitle("/members/new"), "Members");
  assert.equal(getPageTitle("/memberships"), "Membership plans");
  assert.equal(getPageTitle("/payments"), "Payments");
  assert.equal(getPageTitle("/reports"), "Reports");
  assert.equal(getPageTitle("/settings"), "Settings");
  assert.equal(getPageTitle("/profile"), "Owner profile");
  assert.equal(getPageTitle("/workouts"), "Workouts");
  assert.equal(getPageTitle("/branches"), "Branches");
  assert.equal(getPageTitle("/admin"), "Platform overview");
  assert.equal(getPageTitle("/admin/gyms"), "Gym accounts");
  assert.equal(getPageTitle("/trainer"), "Trainer workspace");
  assert.equal(getPageTitle("/unknown"), "Dashboard");
});
