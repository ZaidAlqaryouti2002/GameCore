// Skeleton only: do not show user-only content before checking the session.
const profileUser = requireLogin();

if (profileUser) {
  document.getElementById("protected-content").hidden = false;
}
