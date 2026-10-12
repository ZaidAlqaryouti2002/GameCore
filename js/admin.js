// Skeleton only: the actual admin interface will be built later.
const adminUser = requireAdmin();

if (adminUser) {
  document.getElementById("protected-content").hidden = false;
}
