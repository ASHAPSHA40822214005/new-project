const routeLinks = document.querySelectorAll('a[href^="/"]');

for (const link of routeLinks) {
  link.addEventListener("click", (event) => {
    const url = new URL(link.href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", url.pathname);
    window.location.assign(url.pathname);
  });
}

window.addEventListener("popstate", () => {
  window.location.assign(window.location.pathname);
});
