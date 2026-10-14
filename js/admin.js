const adminUser = requireAdmin();
const productRows = document.getElementById("admin-products");
const catalogStatus = document.getElementById("catalog-status");
const adminMessage = document.getElementById("admin-message");
const editorMessage = document.getElementById("editor-message");
const productEditor = document.getElementById("product-editor");
const productForm = document.getElementById("product-form");
const searchInput = document.getElementById("admin-search");
const categoryFilter = document.getElementById("category-filter");
const newProductButton = document.getElementById("new-product-button");
const reloadButton = document.getElementById("reload-products-button");
const saveButton = document.getElementById("save-product-button");
const generateButton = document.getElementById("generate-description-button");
const descriptionInput = document.getElementById("product-description");
const draftPanel = document.getElementById("ai-draft");

let adminProducts = [];
let editingProductId = null;
let formDirty = false;
let isSaving = false;
let isDeleting = false;
let isGenerating = false;
let isLoading = false;
let editorVersion = 0;

function showAdminMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.hidden = false;
}

function updateEditorButtons() {
  saveButton.disabled = isSaving || isGenerating || isLoading;
  generateButton.disabled = isSaving || isGenerating || !AI_DESCRIPTION_URL;
  newProductButton.disabled = isSaving || isDeleting || isLoading;
  reloadButton.disabled = isSaving || isDeleting || isLoading;
  document.getElementById("close-editor-button").disabled = isSaving;
  document.getElementById("cancel-edit-button").disabled = isSaving;

  productRows.querySelectorAll("button").forEach(function (button) {
    button.disabled = isSaving || isDeleting || isLoading;
  });

  productForm.querySelectorAll("input, select, textarea").forEach(function (input) {
    input.disabled = isSaving;
  });
}

function closeEditor(force = false) {
  if (isSaving) {
    return;
  }

  if (!force && formDirty && !window.confirm("Discard unsaved changes?")) {
    return;
  }

  editorVersion += 1;
  productEditor.hidden = true;
  draftPanel.hidden = true;
  formDirty = false;
  editingProductId = null;
  newProductButton.focus();
}

function openEditor(product) {
  if (isSaving || isDeleting) {
    return;
  }

  if (formDirty && !window.confirm("Discard unsaved changes?")) {
    return;
  }

  editorVersion += 1;
  productForm.reset();
  editingProductId = product ? String(product.id) : null;
  formDirty = false;
  editorMessage.hidden = true;
  draftPanel.hidden = true;

  if (product) {
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-brand").value = product.brand;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-stock").value = product.stock;
    document.getElementById("product-image").value = product.image;
    descriptionInput.value = product.description || "";
  }

  document.getElementById("editor-title").textContent = product ? "Edit Product" : "Add Product";
  saveButton.textContent = product ? "Save Changes" : "Add Product";
  productEditor.hidden = false;
  updateEditorButtons();
  document.getElementById("product-name").focus();
}

function renderAdminProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filteredProducts = adminProducts.filter(function (product) {
    const matchesSearch = String(product.name).toLowerCase().includes(query) ||
      String(product.brand).toLowerCase().includes(query);
    return matchesSearch && (!category || product.category === category);
  });

  productRows.innerHTML = "";
  catalogStatus.hidden = false;
  catalogStatus.textContent = filteredProducts.length === 0
    ? "No products found."
    : filteredProducts.length + (filteredProducts.length === 1 ? " product" : " products");

  filteredProducts.forEach(function (product) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><div class="admin-product-cell"><img alt="" loading="lazy">
        <div><strong class="admin-product-name"></strong><span class="admin-product-brand"></span></div>
      </div></td>
      <td class="admin-product-category"></td>
      <td class="admin-product-price"></td>
      <td><span class="stock-label"></span></td>
      <td><div class="row-actions">
        <button class="admin-icon-button edit-product" type="button"><i class="bi bi-pencil" aria-hidden="true"></i></button>
        <button class="admin-icon-button delete-product" type="button"><i class="bi bi-trash3" aria-hidden="true"></i></button>
      </div></td>
    `;

    row.querySelector("img").src = product.image;
    row.querySelector(".admin-product-name").textContent = product.name;
    row.querySelector(".admin-product-brand").textContent = product.brand;
    row.querySelector(".admin-product-category").textContent = product.category;
    row.querySelector(".admin-product-price").textContent = "$" + Number(product.price).toFixed(2);
    const stockLabel = row.querySelector(".stock-label");
    stockLabel.textContent = Number(product.stock) === 0 ? "Out of stock" : product.stock;
    stockLabel.classList.toggle("empty-stock", Number(product.stock) === 0);

    const editButton = row.querySelector(".edit-product");
    const deleteButton = row.querySelector(".delete-product");
    editButton.setAttribute("aria-label", "Edit " + product.name);
    editButton.title = "Edit " + product.name;
    deleteButton.setAttribute("aria-label", "Delete " + product.name);
    deleteButton.title = "Delete " + product.name;
    editButton.addEventListener("click", function () { openEditor(product); });
    deleteButton.addEventListener("click", function () { removeAdminProduct(product); });
    productRows.appendChild(row);
  });

  updateEditorButtons();
}

async function loadAdminProducts() {
  isLoading = true;
  catalogStatus.hidden = false;
  catalogStatus.textContent = "Loading products...";
  updateEditorButtons();

  try {
    const products = await getProducts();

    if (!Array.isArray(products)) {
      throw new Error("Could not load products.");
    }

    adminProducts = products;
    renderAdminProducts();
  } catch (error) {
    catalogStatus.textContent = "Could not load products. Please use Reload to try again.";
  } finally {
    isLoading = false;
    updateEditorButtons();
  }
}

async function saveAdminProduct(event) {
  event.preventDefault();
  editorMessage.hidden = true;

  if (isSaving || isDeleting || isGenerating || isLoading || !requireAdmin() || !productForm.reportValidity()) {
    return;
  }

  const product = {
    name: document.getElementById("product-name").value.trim(),
    brand: document.getElementById("product-brand").value.trim(),
    category: document.getElementById("product-category").value,
    price: Number(document.getElementById("product-price").value),
    stock: Number(document.getElementById("product-stock").value),
    image: document.getElementById("product-image").value.trim(),
    description: descriptionInput.value.trim()
  };

  if (!product.name || !product.brand || !product.description) {
    showAdminMessage(editorMessage, "Enter a name, brand and description.", true);
    return;
  }

  if (!Number.isFinite(product.price) || product.price < 0 ||
      !Number.isInteger(product.stock) || product.stock < 0 ||
      !["consoles", "games", "accessories"].includes(product.category)) {
    showAdminMessage(editorMessage, "Check the category, price and stock values.", true);
    return;
  }

  try {
    const imageUrl = new URL(product.image);
    if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
      throw new Error("Invalid image URL");
    }
  } catch (error) {
    showAdminMessage(editorMessage, "Enter an image URL starting with http:// or https://.", true);
    document.getElementById("product-image").focus();
    return;
  }

  const productId = editingProductId;
  const version = editorVersion;
  isSaving = true;
  saveButton.textContent = "Saving...";
  productForm.setAttribute("aria-busy", "true");
  updateEditorButtons();

  try {
    const savedProduct = productId
      ? await updateProduct(productId, product)
      : await createProduct(product);

    if (productId) {
      adminProducts = adminProducts.map(function (item) {
        return String(item.id) === productId ? savedProduct : item;
      });
    } else {
      adminProducts.unshift(savedProduct);
    }

    searchInput.value = "";
    categoryFilter.value = "";
    renderAdminProducts();
    showAdminMessage(adminMessage, productId ? "Product updated." : "Product added.");
    formDirty = false;
  } catch (error) {
    showAdminMessage(editorMessage, error instanceof TypeError
      ? "Could not connect. Your changes have not been saved. Please try again."
      : error.message, true);
    return;
  } finally {
    isSaving = false;
    saveButton.textContent = productId ? "Save Changes" : "Add Product";
    productForm.removeAttribute("aria-busy");
    updateEditorButtons();
  }

  if (version === editorVersion) {
    closeEditor(true);
  }
}

async function removeAdminProduct(product) {
  if (isSaving || isDeleting || !requireAdmin()) {
    return;
  }

  if (!window.confirm('Delete "' + product.name + '"? This cannot be undone.')) {
    return;
  }

  isDeleting = true;
  updateEditorButtons();

  try {
    await deleteProduct(product.id);
    adminProducts = adminProducts.filter(function (item) {
      return String(item.id) !== String(product.id);
    });
    if (editingProductId === String(product.id)) {
      closeEditor(true);
    }
    renderAdminProducts();
    showAdminMessage(adminMessage, "Product deleted.");
  } catch (error) {
    showAdminMessage(adminMessage, "Could not delete the product. Please try again.", true);
  } finally {
    isDeleting = false;
    updateEditorButtons();
  }
}

async function createDescriptionDraft() {
  if (isGenerating || isSaving || !AI_DESCRIPTION_URL || !requireAdmin()) {
    return;
  }

  const product = {
    name: document.getElementById("product-name").value.trim(),
    brand: document.getElementById("product-brand").value.trim(),
    category: document.getElementById("product-category").value,
    details: descriptionInput.value.trim()
  };

  if (!product.name || !product.brand || !product.category) {
    showAdminMessage(editorMessage, "Enter the product name, brand and category first.", true);
    return;
  }

  const version = editorVersion;
  isGenerating = true;
  editorMessage.hidden = true;
  generateButton.textContent = "Generating...";
  updateEditorButtons();

  try {
    const description = await generateProductDescription(product);
    if (version !== editorVersion || productEditor.hidden) {
      return;
    }
    document.getElementById("draft-text").textContent = description;
    draftPanel.hidden = false;
  } catch (error) {
    if (version === editorVersion && !productEditor.hidden) {
      showAdminMessage(editorMessage, "Could not generate a description. Please try again.", true);
    }
  } finally {
    isGenerating = false;
    generateButton.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> Generate Description';
    updateEditorButtons();
  }
}

if (adminUser) {
  document.getElementById("protected-content").hidden = false;
  newProductButton.addEventListener("click", function () { openEditor(null); });
  document.getElementById("close-editor-button").addEventListener("click", function () { closeEditor(); });
  document.getElementById("cancel-edit-button").addEventListener("click", function () { closeEditor(); });
  productForm.addEventListener("submit", saveAdminProduct);
  productForm.addEventListener("input", function () {
    formDirty = true;
    editorVersion += 1;
    draftPanel.hidden = true;
  });
  searchInput.addEventListener("input", renderAdminProducts);
  categoryFilter.addEventListener("change", renderAdminProducts);
  reloadButton.addEventListener("click", loadAdminProducts);
  generateButton.addEventListener("click", createDescriptionDraft);
  document.getElementById("use-draft-button").addEventListener("click", function () {
    descriptionInput.value = document.getElementById("draft-text").textContent.slice(0, 3000);
    draftPanel.hidden = true;
    formDirty = true;
    editorVersion += 1;
    descriptionInput.focus();
  });
  document.getElementById("discard-draft-button").addEventListener("click", function () {
    draftPanel.hidden = true;
  });

  if (AI_DESCRIPTION_URL) {
    document.getElementById("ai-availability").hidden = true;
    document.getElementById("ai-control").title = "Generate a description draft";
    document.getElementById("ai-control").removeAttribute("tabindex");
  }

  updateEditorButtons();
  loadAdminProducts();
}
