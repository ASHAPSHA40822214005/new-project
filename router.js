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

// Animate language badges on click then navigate
document.querySelectorAll('.language-badge').forEach(b => {
  b.addEventListener('click', (ev) => {
    // If clicked on a child element, find the closest anchor
    const anchor = ev.currentTarget;
    const href = anchor.getAttribute('href');
    if (!href) return;
    ev.preventDefault();
    // add animation class
    anchor.classList.remove('animate-badge');
    // force reflow
    void anchor.offsetWidth;
    anchor.classList.add('animate-badge');
    // navigate after animation completes
    setTimeout(() => {
      window.location.href = href;
    }, 420);
  });
});
