import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("category");

  loadProducts(selectedCategory);
  setupCategoryFilters();
  setupToggleCategory();
});

function loadProducts(selectedCategory = null) {
  const productsRef = collection(db, "products");

  getDocs(productsRef)
    .then(snapshot => {
      allProducts = []; // Reset
      snapshot.forEach(doc => {
        const data = doc.data();
        allProducts.push({ ...data, id: doc.id });
      });

      // If a category was passed in URL, filter it
      if (selectedCategory) {
        const filtered = allProducts.filter(p =>
          p.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
        displayProducts(filtered);
      } else {
        displayProducts(allProducts); // Show all by default
      }
    })
    .catch(error => console.error("Error loading products:", error));
}

function displayProducts(products) {
  const container = document.getElementById('product-list');
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products found for this category.</p>";
    return;
  }

  products.forEach(data => {
    const card = document.createElement('div');
    card.className = 'home-products-card';

    // --- CHECK INVENTORY ---
    const inventory = data.inventory || {};
    let totalStock = 0;

    Object.keys(inventory).forEach(size => {
      totalStock += Number(inventory[size] || 0);
    });

    const outOfStock = totalStock <= 0;

    card.innerHTML = `
      <div class="home-products-image" style="position: relative;">
        <img src="${data.image}" class="main-image">
        <img src="${data.hoverImage}" class="hover-image">
        ${
          outOfStock
            ? `<div class="stock-badge" style="
                position:absolute;
                top:10px;
                left:10px;
                background:#000;
                color:#fff;
                padding:5px 10px;
                font-size:12px;
                border-radius:4px;
                text-transform:uppercase;
                opacity:0.85;">
                Out of Stock
              </div>`
            : ""
        }
      </div>
      <div class="home-products-details">
        <p class="home-products-name">${data.name}</p>
        <p class="home-products-price">₦${Number(data.price).toLocaleString()}</p>
      </div>
    `;

    if (!outOfStock) {
      // clickable only when in stock
      card.addEventListener('click', () => {
        window.location.href = `product-page.html?id=${data.id}`;
      });
    } else {
      // disable click + dim
      card.style.opacity = "0.6";
      card.style.cursor = "not-allowed";
    }

    container.appendChild(card);
  });
}


function setupCategoryFilters() {
  const categoryLinks = document.querySelectorAll(".category-list a");

  categoryLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.getAttribute("data-category");

      // Remove .active from all
      categoryLinks.forEach(l => l.classList.remove("active"));
      // Add to clicked
      link.classList.add("active");

      // Filter products
      if (category === "All") {
        displayProducts(allProducts);
      } else {
        const filtered = allProducts.filter(p =>
          p.category?.toLowerCase() === category.toLowerCase()
        );
        displayProducts(filtered);
      }

      // Optionally update URL without reload
      const newUrl = category === "All" ? "products.html" : `products.html?category=${category}`;
      window.history.pushState({}, "", newUrl);
    });
  });
}

function setupToggleCategory() {
  const toggleBtn = document.getElementById("toggleCategory");
  const categoryList = document.getElementById("categoryList");

  if (toggleBtn && categoryList) {
    toggleBtn.addEventListener("click", () => {
      categoryList.classList.toggle("show");
      toggleBtn.classList.toggle("active");
    });
  }
}
