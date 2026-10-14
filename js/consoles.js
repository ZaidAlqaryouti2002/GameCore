const consoleFilters = document.getElementById("console-filters");
const consoleSort = document.getElementById("console-sort");
const consoleRetry = document.getElementById("console-retry");
let consoleProducts = [];
let filteredConsoles = [];
let consolePage = 1;
const consolesPerPage = 6;

function displayConsolePage() {
  const start = (consolePage - 1) * consolesPerPage;
  displayProducts(filteredConsoles.slice(start, start + consolesPerPage));
  document.getElementById("results-count").textContent = "Showing " + filteredConsoles.length + " products";
  document.getElementById("page-range").textContent = filteredConsoles.length
    ? "Showing " + (start + 1) + "–" + Math.min(start + consolesPerPage, filteredConsoles.length) + " of " + filteredConsoles.length + " products"
    : "";
  const pagination = document.getElementById("console-pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredConsoles.length / consolesPerPage);
  if (totalPages <= 1) return;
  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = page;
    button.setAttribute("aria-label", "Page " + page);
    if (page === consolePage) button.setAttribute("aria-current", "page");
    button.addEventListener("click", function () {
      consolePage = page;
      displayConsolePage();
      document.getElementById("catalog-title").scrollIntoView({ block: "start" });
      document.getElementById("console-pagination").querySelector('[aria-current="page"]').focus({ preventScroll: true });
    });
    pagination.appendChild(button);
  }
}

function filterConsoles() {
  const minInput = document.getElementById("min-price");
  const maxInput = document.getElementById("max-price");
  const min = minInput.value === "" ? 0 : Number(minInput.value);
  const max = maxInput.value === "" ? Infinity : Number(maxInput.value);
  const error = document.getElementById("filter-error");
  if (min > max) {
    error.textContent = "Minimum price must be less than or equal to maximum price.";
    error.hidden = false;
    return;
  }
  error.hidden = true;
  const brands = Array.from(consoleFilters.querySelectorAll('input[name="brand"]:checked')).map(function (input) { return input.value; });
  const availability = Array.from(consoleFilters.querySelectorAll('input[name="availability"]:checked')).map(function (input) { return input.value; });
  const query = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase();
  filteredConsoles = consoleProducts.filter(function (product) {
    const stock = Number(product.stock) > 0 ? "in" : "out";
    const matchesQuery = [product.name, product.brand, product.category].some(function (value) { return String(value || "").toLowerCase().includes(query); });
    return matchesQuery && (brands.length === 0 || brands.includes(String(product.brand || ""))) &&
      Number(product.price) >= min && Number(product.price) <= max &&
      (availability.length === 0 || availability.includes(stock));
  });
  if (consoleSort.value === "price-low") filteredConsoles.sort(function (a, b) { return Number(a.price) - Number(b.price); });
  if (consoleSort.value === "price-high") filteredConsoles.sort(function (a, b) { return Number(b.price) - Number(a.price); });
  if (consoleSort.value === "name") filteredConsoles.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  consolePage = 1;
  displayConsolePage();
}

async function loadConsoles() {
  consoleRetry.hidden = true;
  productsMessage.hidden = false;
  productsMessage.textContent = "Loading products...";
  try {
    const products = await getProducts();
    consoleProducts = products.filter(function (product) { return product.category === "consoles"; });
    document.getElementById("console-count").textContent = consoleProducts.length;
    document.getElementById("in-stock-count").textContent = consoleProducts.filter(function (product) { return Number(product.stock) > 0; }).length;
    document.getElementById("out-stock-count").textContent = consoleProducts.filter(function (product) { return Number(product.stock) <= 0; }).length;
    const brands = [];
    consoleProducts.forEach(function (product) {
      if (product.brand && !brands.includes(String(product.brand))) brands.push(String(product.brand));
    });
    const brandOptions = document.getElementById("brand-options");
    brandOptions.innerHTML = "";
    brands.sort().forEach(function (brand) {
      const label = document.createElement("label");
      label.className = "filter-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "brand";
      input.value = brand;
      const count = document.createElement("span");
      count.textContent = consoleProducts.filter(function (product) { return String(product.brand) === brand; }).length;
      label.append(input, document.createTextNode(brand), count);
      brandOptions.appendChild(label);
    });
    if (brands.length === 0) brandOptions.textContent = "No brands available.";
    filterConsoles();
  } catch (error) {
    productsMessage.textContent = "Consoles could not be loaded. Please try again.";
    productsMessage.hidden = false;
    consoleRetry.hidden = false;
  }
}

consoleFilters.addEventListener("submit", function (event) { event.preventDefault(); filterConsoles(); });
consoleFilters.addEventListener("reset", function () {
  setTimeout(function () { consoleSort.value = "featured"; filterConsoles(); }, 0);
});
consoleSort.addEventListener("change", filterConsoles);
consoleRetry.addEventListener("click", loadConsoles);
loadConsoles();
