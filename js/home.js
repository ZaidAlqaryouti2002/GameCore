let homeProducts = [];

function hasProductDeal(product) {
  return Number.isFinite(Number(product.originalPrice)) &&
    Number(product.originalPrice) > Number(product.price) && Number(product.price) >= 0;
}

function getNewestProducts(products) {
  const newest = products.slice().reverse();
  if (products.length && products.every(function (product) {
    return product.createdAt && Number.isFinite(Date.parse(product.createdAt));
  })) {
    newest.sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt); });
  }
  return newest;
}

function showHomeCollection(type) {
  const dealsSelected = type === "deals";
  const dealsTab = document.getElementById("deals-tab");
  const arrivalsTab = document.getElementById("arrivals-tab");
  dealsTab.setAttribute("aria-selected", String(dealsSelected));
  arrivalsTab.setAttribute("aria-selected", String(!dealsSelected));
  dealsTab.tabIndex = dealsSelected ? 0 : -1;
  arrivalsTab.tabIndex = dealsSelected ? -1 : 0;
  document.getElementById("collection-panel").setAttribute("aria-labelledby", dealsSelected ? "deals-tab" : "arrivals-tab");

  const products = dealsSelected ? homeProducts.filter(hasProductDeal) : getNewestProducts(homeProducts);
  const message = document.getElementById("collection-message");
  displayProducts(products.slice(0, 4), document.getElementById("collection-grid"), message);
  if (!products.length) {
    message.textContent = dealsSelected ? "No deals available right now." : "No products available yet.";
  }

  const link = document.getElementById("collection-view-all");
  link.href = dealsSelected ? "index.html?view=all&offers=true" : "index.html?view=all&sort=newest";
  link.hidden = products.length === 0;
}

async function loadHomeProducts() {
  const retryButton = document.getElementById("home-retry");
  retryButton.hidden = true;
  retryButton.disabled = true;
  productsMessage.hidden = false;
  productsMessage.textContent = "Loading products...";

  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  const listView = Boolean(query) || params.get("view") === "all";
  const dealsOnly = params.get("offers") === "true";
  document.getElementById("home-hero").hidden = listView;
  document.getElementById("home-collections").hidden = true;
  document.getElementById("featured-view-all").hidden = listView;

  if (listView) {
    const currentHeading = document.getElementById("featured-title");
    const heading = document.createElement("h1");
    heading.id = "featured-title";
    heading.textContent = query ? 'Search results for "' + query + '"' : dealsOnly ? "Top Deals" : "All Products";
    currentHeading.replaceWith(heading);
  }

  try {
    const products = await getProducts();
    homeProducts = products;

    if (listView) {
      let matchingProducts = homeProducts.filter(function (product) {
        const text = [product.name, product.brand, product.category].join(" ").toLowerCase();
        return text.includes(query.toLowerCase()) && (!dealsOnly || hasProductDeal(product));
      });
      if (params.get("sort") === "newest") {
        matchingProducts = getNewestProducts(matchingProducts);
      }
      displayProducts(matchingProducts);
      document.getElementById("home-results-count").textContent = matchingProducts.length +
        (matchingProducts.length === 1 ? " product" : " products");
    } else {
      const featured = [];
      ["consoles", "games", "accessories"].forEach(function (category) {
        const product = homeProducts.find(function (item) {
          return item.category === category && Number(item.stock) > 0;
        });
        if (product) { featured.push(product); }
      });
      homeProducts.forEach(function (product) {
        if (featured.length < 4 && !featured.includes(product)) { featured.push(product); }
      });
      displayProducts(featured);
      document.getElementById("home-collections").hidden = homeProducts.length === 0;
      showHomeCollection(homeProducts.some(hasProductDeal) ? "deals" : "arrivals");
    }
  } catch (error) {
    productsMessage.textContent = "Products could not be loaded. Please try again.";
    productsMessage.hidden = false;
    retryButton.hidden = false;
    console.error(error);
  } finally {
    retryButton.disabled = false;
  }
}

document.getElementById("deals-tab").addEventListener("click", function () { showHomeCollection("deals"); });
document.getElementById("arrivals-tab").addEventListener("click", function () { showHomeCollection("arrivals"); });
document.querySelector(".home-tabs").addEventListener("keydown", function (event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { return; }
  event.preventDefault();
  const current = document.getElementById("deals-tab").getAttribute("aria-selected") === "true";
  const selectDeals = event.key === "Home" || (event.key !== "End" && !current);
  showHomeCollection(selectDeals ? "deals" : "arrivals");
  document.getElementById(selectDeals ? "deals-tab" : "arrivals-tab").focus();
});
document.getElementById("home-retry").addEventListener("click", loadHomeProducts);
loadHomeProducts();
