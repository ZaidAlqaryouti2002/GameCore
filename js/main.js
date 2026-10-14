const productsGrid = document.getElementById("products-grid");
const productsMessage = document.getElementById("products-message");

function addToCart(productId) {
  const cart = getStoredCart();
  const existingItem = cart.find(function (item) {
    return String(item.id) === String(productId);
  });

  if (existingItem) {
    return;
  }

  cart.push({ id: productId, quantity: 1 });
  localStorage.setItem("gamecore_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateProductButtons() {
  const cart = getStoredCart();
  document.querySelectorAll(".add-to-cart-button").forEach(function (button) {
    const id = button.dataset.productId;
    const stock = Number(button.dataset.stock);
    const isInCart = cart.some(function (item) {
      return String(item.id) === id;
    });

    button.classList.toggle("remove-from-cart", isInCart);
    button.disabled = false;

    if (!id) {
      button.textContent = "Unavailable";
      button.disabled = true;
    } else if (isInCart) {
      button.innerHTML = '<i class="bi bi-cart-dash" aria-hidden="true"></i> Remove from Cart';
    } else if (stock <= 0) {
      button.textContent = "Out of Stock";
      button.disabled = true;
    } else {
      button.innerHTML = '<i class="bi bi-cart-plus" aria-hidden="true"></i> Add to Cart';
    }
  });
}

function displayProducts(products, grid = productsGrid, message = productsMessage) {
  grid.innerHTML = "";
  message.hidden = false;

  if (products.length === 0) {
    message.textContent = "No products found.";
    return;
  }

  message.hidden = true;
  const isHome = document.body.dataset.page === "home";
  const headingTag = isHome ? "h3" : "h2";

  products.forEach(function (product) {
    const productCard = document.createElement("article");
    productCard.classList.add("product-card");
    const productUrl = new URL("pages/product.html", PROJECT_URL);
    productUrl.searchParams.set("id", product.id);
    const price = Number(product.price);
    const originalPrice = Number(product.originalPrice);
    const hasDiscount = Number.isFinite(originalPrice) && originalPrice > price && price >= 0;
    const discount = hasDiscount ? Math.round((originalPrice - price) / originalPrice * 100) : 0;
    const stockText = isHome
      ? (Number(product.stock) > 0 ? "In stock" : "Out of stock")
      : "In stock: " + Number(product.stock);

    productCard.innerHTML = `
      <a class="product-image-link" href="${productUrl.href}" tabindex="-1" aria-hidden="true">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
        <span class="product-image-unavailable" hidden>Image unavailable</span>
        ${hasDiscount && discount > 0 ? '<span class="product-discount">-' + discount + '%</span>' : ''}
      </a>
      <div class="product-info">
        <p class="product-category">${escapeHTML(product.category)}</p>
        <${headingTag}><a href="${productUrl.href}">${escapeHTML(product.name)}</a></${headingTag}>
        <p class="product-brand">${escapeHTML(product.brand)}</p>
        ${document.body.dataset.page === 'games' ? '<div class="game-platforms">' + (Array.isArray(product.platforms || product.platform) ? (product.platforms || product.platform) : String(product.platforms || product.platform || '').split(',')).filter(function (platform) { return String(platform).trim(); }).map(function (platform) { return '<span>' + escapeHTML(String(platform).trim()) + '</span>'; }).join('') + '</div>' : ''}
        <div class="product-purchase-info">
          <p class="product-price">$${price.toFixed(2)} ${hasDiscount ? '<del class="product-old-price">$' + originalPrice.toFixed(2) + '</del>' : ''}</p>
          <p class="product-stock${Number(product.stock) <= 0 ? ' out-of-stock' : ''}">${stockText}</p>
        </div>
        <button class="add-to-cart-button" type="button">Add to Cart</button>
      </div>
    `;

    productCard.querySelector("img").addEventListener("error", function (event) {
      event.target.hidden = true;
      productCard.querySelector(".product-image-unavailable").hidden = false;
    });

    const addButton = productCard.querySelector(".add-to-cart-button");
    addButton.dataset.productId = product.id == null ? "" : String(product.id).trim();
    addButton.dataset.stock = product.stock;
    addButton.addEventListener("click", function () {
      const cart = getStoredCart();
      const isInCart = cart.some(function (item) {
        return String(item.id) === String(product.id);
      });

      if (isInCart) {
        const updatedCart = cart.filter(function (item) {
          return String(item.id) !== String(product.id);
        });
        localStorage.setItem("gamecore_cart", JSON.stringify(updatedCart));
        updateCartCount();
      } else {
        addToCart(product.id);
      }

      updateProductButtons();
    });

    grid.appendChild(productCard);
  });

  updateProductButtons();
}

async function loadProducts() {
  try {
    const products = await getProducts();
    const params = new URLSearchParams(window.location.search);
    const query = (params.get("q") || "").trim().toLowerCase();
    const category = document.body.dataset.category || "";
    const matchingProducts = products.filter(function (product) {
      const matchesCategory = category === "" || product.category === category;
      const matchesSearch = String(product.name).toLowerCase().includes(query) ||
        String(product.category).toLowerCase().includes(query) ||
        String(product.brand).toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    displayProducts(matchingProducts);
  } catch (error) {
    productsMessage.hidden = false;
    productsMessage.textContent = "Products could not be loaded. Please try again.";
    console.error(error);
  }
}

if (document.body.dataset.page !== "home" && !document.body.dataset.catalog) {
  loadProducts();
}
