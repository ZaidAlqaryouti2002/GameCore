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

  cart.push({
    id: productId,
    quantity: 1
  });

  localStorage.setItem("gamecore_cart", JSON.stringify(cart));
  updateCartCount();
}

function displayProducts(products) {
  productsGrid.innerHTML = "";

  if (products.length === 0) {
    productsMessage.textContent = "No products found.";
    return;
  }

  productsMessage.hidden = true;

  products.forEach(function (product) {
    const productCard = document.createElement("article");
    productCard.classList.add("product-card");

    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}">

      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h2>
        <a href="${new URL("pages/product.html", PROJECT_URL).href}?id=${encodeURIComponent(product.id)}">
        ${product.name}
        </a>
        </h2>
        <p class="product-brand">${product.brand}</p>
        <p class="product-price">$${Number(product.price).toFixed(2)}</p>
        <p class="product-stock">In stock: ${product.stock}</p>

        <button class="add-to-cart-button" type="button">
          Add to Cart
        </button>
      </div>
    `;

    productsGrid.appendChild(productCard);

    const addButton = productCard.querySelector(".add-to-cart-button");

    if (product.id === undefined || product.id === null || String(product.id).trim() === "") {
      addButton.textContent = "Unavailable";
      addButton.disabled = true;
      return;
    }

    const isInCart = getStoredCart().some(function (item) {
      return String(item.id) === String(product.id);
    });

    if (isInCart) {
      addButton.textContent = "In Cart";
      addButton.disabled = true;
    }

    addButton.addEventListener("click", function () {
      addToCart(product.id);
      addButton.textContent = "In Cart";
      addButton.disabled = true;
    });
  });
}

async function loadProducts() {
  try {
    const products = await getProducts();

    const params = new URLSearchParams(window.location.search);
    const query = (params.get("q") || "").trim().toLowerCase();
    const category = document.body.dataset.category || "";

    const matchingProducts = products.filter(function (product) {
      const matchesCategory =
        category === "" || product.category === category;

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    displayProducts(matchingProducts);
  } catch (error) {
    productsMessage.hidden = false;
    productsMessage.textContent =
      "Products could not be loaded. Please try again.";
    console.error(error);
  }
}

loadProducts();
