const catalogFilters = document.getElementById("catalog-filters");
const catalogSort = document.getElementById("catalog-sort");
const catalogRetry = document.getElementById("catalog-retry");
let catalogProducts = [];
let filteredProducts = [];
let catalogPage = 1;
const productsPerPage = 6;

function getDiscountPercentage(product) {
  const price = Number(product.price);
  const originalPrice = Number(product.originalPrice);
  if (!Number.isFinite(price) || !Number.isFinite(originalPrice) || price < 0 || originalPrice <= price) return 0;
  return (originalPrice - price) / originalPrice * 100;
}

function getProductOptions(product, field) {
  const value = field === "platform" ? (product.platforms || product.platform) : product[field];
  if (Array.isArray(value)) return value.map(String);
  return String(value || "").split(",").map(function (option) { return option.trim(); }).filter(Boolean);
}

function createGameFilter(field) {
  const container = document.getElementById(field + "-options");
  if (!container) return;
  const values = [];
  catalogProducts.forEach(function (product) {
    getProductOptions(product, field).forEach(function (value) {
      if (!values.includes(value)) values.push(value);
    });
  });
  container.innerHTML = "";
  if (field !== "type") container.parentElement.hidden = values.length === 0;
  values.sort().forEach(function (value) {
    const label = document.createElement("label");
    label.className = "filter-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = field;
    input.value = value;
    const count = document.createElement("span");
    count.textContent = catalogProducts.filter(function (product) { return getProductOptions(product, field).includes(value); }).length;
    label.append(input, document.createTextNode(value), count);
    container.appendChild(label);
  });
}

function displayCatalogPage() {
  const start = (catalogPage - 1) * productsPerPage;
  displayProducts(filteredProducts.slice(start, start + productsPerPage));
  if (document.body.dataset.page === "deals" && catalogProducts.length === 0) productsMessage.textContent = "No deals available right now.";
  document.getElementById("results-count").textContent = "Showing " + filteredProducts.length + " products";
  document.getElementById("page-range").textContent = filteredProducts.length
    ? "Showing " + (start + 1) + "–" + Math.min(start + productsPerPage, filteredProducts.length) + " of " + filteredProducts.length + " products"
    : "";
  const pagination = document.getElementById("catalog-pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (totalPages <= 1) return;
  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = page;
    button.setAttribute("aria-label", "Page " + page);
    if (page === catalogPage) button.setAttribute("aria-current", "page");
    button.addEventListener("click", function () {
      catalogPage = page;
      displayCatalogPage();
      document.getElementById("catalog-title").scrollIntoView({ block: "start" });
      document.getElementById("catalog-pagination").querySelector('[aria-current="page"]').focus({ preventScroll: true });
    });
    pagination.appendChild(button);
  }
}

function filterCatalog() {
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
  const brands = Array.from(catalogFilters.querySelectorAll('input[name="brand"]:checked')).map(function (input) { return input.value; });
  const availability = Array.from(catalogFilters.querySelectorAll('input[name="availability"]:checked')).map(function (input) { return input.value; });
  const genres = Array.from(catalogFilters.querySelectorAll('input[name="genre"]:checked')).map(function (input) { return input.value; });
  const platforms = Array.from(catalogFilters.querySelectorAll('input[name="platform"]:checked')).map(function (input) { return input.value; });
  const types = Array.from(catalogFilters.querySelectorAll('input[name="type"]:checked')).map(function (input) { return input.value; });
  const categories = Array.from(catalogFilters.querySelectorAll('input[name="category"]:checked')).map(function (input) { return input.value; });
  const discountInput = catalogFilters.querySelector('input[name="discount"]:checked');
  const minimumDiscount = discountInput ? Number(discountInput.value) : 0;
  const query = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase();
  filteredProducts = catalogProducts.filter(function (product) {
    const stock = Number(product.stock) > 0 ? "in" : "out";
    const matchesQuery = [product.name, product.brand, product.category].some(function (value) { return String(value || "").toLowerCase().includes(query); });
    return matchesQuery && (brands.length === 0 || brands.includes(String(product.brand || ""))) &&
      Number(product.price) >= min && Number(product.price) <= max &&
      (availability.length === 0 || availability.includes(stock)) &&
      (genres.length === 0 || genres.some(function (genre) { return getProductOptions(product, "genre").includes(genre); })) &&
      (platforms.length === 0 || platforms.some(function (platform) { return getProductOptions(product, "platform").includes(platform); })) &&
      (types.length === 0 || types.some(function (type) { return getProductOptions(product, "type").includes(type); })) &&
      (categories.length === 0 || categories.includes(String(product.category))) &&
      getDiscountPercentage(product) >= minimumDiscount;
  });
  if (catalogSort.value === "price-low") filteredProducts.sort(function (a, b) { return Number(a.price) - Number(b.price); });
  if (catalogSort.value === "price-high") filteredProducts.sort(function (a, b) { return Number(b.price) - Number(a.price); });
  if (catalogSort.value === "name") filteredProducts.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  if (catalogSort.value === "discount") filteredProducts.sort(function (a, b) { return getDiscountPercentage(b) - getDiscountPercentage(a); });
  catalogPage = 1;
  displayCatalogPage();
}

async function loadCatalog() {
  catalogRetry.hidden = true;
  productsMessage.hidden = false;
  productsMessage.textContent = "Loading products...";
  try {
    const products = await getProducts();
    catalogProducts = products.filter(function (product) {
      if (document.body.dataset.page === "deals") return getDiscountPercentage(product) > 0;
      return product.category === document.body.dataset.category;
    });
    createGameFilter("genre");
    createGameFilter("platform");
    createGameFilter("type");
    createGameFilter("category");
    document.getElementById("catalog-count").textContent = catalogProducts.length;
    document.getElementById("in-stock-count").textContent = catalogProducts.filter(function (product) { return Number(product.stock) > 0; }).length;
    document.getElementById("out-stock-count").textContent = catalogProducts.filter(function (product) { return Number(product.stock) <= 0; }).length;
    const brands = [];
    catalogProducts.forEach(function (product) {
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
      count.textContent = catalogProducts.filter(function (product) { return String(product.brand) === brand; }).length;
      label.append(input, document.createTextNode(brand), count);
      brandOptions.appendChild(label);
    });
    if (brands.length === 0) brandOptions.textContent = "No brands available.";
    filterCatalog();
  } catch (error) {
    productsMessage.textContent = "Products could not be loaded. Please try again.";
    productsMessage.hidden = false;
    catalogRetry.hidden = false;
  }
}

catalogFilters.addEventListener("submit", function (event) { event.preventDefault(); filterCatalog(); });
catalogFilters.addEventListener("reset", function () {
  setTimeout(function () { catalogSort.value = "featured"; filterCatalog(); }, 0);
});
catalogSort.addEventListener("change", filterCatalog);
catalogRetry.addEventListener("click", loadCatalog);
loadCatalog();
