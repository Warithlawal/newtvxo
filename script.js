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
  loadHomeProducts();
  loadHomepageMedia();
  fetchAllProductsForSearch();
  setupSearch();
});

/* ============================
   LOAD HOMEPAGE PRODUCTS
============================ */
function loadHomeProducts() {
  const productsRef = collection(db, "products");
  const container = document.getElementById("home-products-container");

  getDocs(productsRef)
    .then(snapshot => {
      container.innerHTML = "";

      if (snapshot.empty) {
        container.innerHTML = "<p>No products available.</p>";
        return;
      }

      snapshot.forEach(item => {
        const data = item.data();
        const totalInventory = data.inventory ? 
          Object.values(data.inventory).reduce((a, b) => a + b, 0) 
        : 0;

        const isOutOfStock = totalInventory <= 0;

        const card = document.createElement("div");
        card.className = "home-products-card";

        card.innerHTML = 
          `
          <div class="home-products-image">
            <img src="${data.image}" class="main-image" alt="${data.name}">
            <img src="${data.hoverImage}" class="hover-image" alt="Alternate view">
            ${isOutOfStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ""}
          </div>
          <div class="home-products-details">
            <p class="home-products-name">${data.name}</p>
            <p class="home-products-price">₦${Number(data.price).toLocaleString()}</p>
          </div>
          `;

        // Disable clicking when out of stock
        if (!isOutOfStock) {
          card.addEventListener("click", () => {
            window.location.href = "product-page.html?id=" + item.id;
          });
        } else {
          card.classList.add("disabled-product"); // for styling (optional)
        }

        container.appendChild(card);
      });
    })
    .catch(error => {
      console.error("Error loading products:", error);
      container.innerHTML = "<p>Error loading products.</p>";
    });
}


/* ============================
   LOAD HOMEPAGE MEDIA
============================ */
async function loadHomepageMedia() {
  try {
    const mediaRef = doc(db, "content", "homepageMedia");
    const mediaSnap = await getDoc(mediaRef);

    if (mediaSnap.exists()) {
      const data = mediaSnap.data();

      const videoSource = document.getElementById("videoSource");
      const image = document.getElementById("homeImage");

      if (data.videoUrl) videoSource.src = data.videoUrl;
      if (data.imageUrl) image.src = data.imageUrl;

      document.getElementById("homeVideo").load();
    } else {
      console.warn("No homepage media found.");
    }
  } catch (err) {
    console.error("Error loading homepage media:", err);
  }
}

/* ============================
   SEARCH FEATURE
============================ */
function setupSearch() {
  const searchInput = document.getElementById("searchInput");

  const popup = document.createElement("div");
  popup.id = "search-popup";
  popup.className = "search-popup";
  document.body.appendChild(popup);

  searchInput.addEventListener("input", function (e) {
    const term = e.target.value.toLowerCase().trim();
    popup.innerHTML = "";

    if (!term) {
      popup.style.display = "none";
      return;
    }

    const filtered = allProducts.filter(p => {
      return p.name && p.name.toLowerCase().includes(term);
    });

    if (filtered.length === 0) {
      popup.innerHTML = '<p style="padding:10px;">No results found</p>';
    } else {
      filtered.forEach(product => {
        const item = document.createElement("div");
        item.className = "search-result-item";

        item.innerHTML =
          '<img src="' + product.image + '" alt="">' +
          "<span>" + product.name + "</span>";

        item.addEventListener("click", () => {
          window.location.href = "product-page.html?id=" + product.id;
        });

        popup.appendChild(item);
      });
    }

    popup.style.display = "block";
  });

  document.addEventListener("click", function (e) {
    if (!popup.contains(e.target) && e.target !== searchInput) {
      popup.style.display = "none";
    }
  });
}

/* ============================
   LOAD PRODUCTS FOR SEARCH
============================ */
function fetchAllProductsForSearch() {
  const ref = collection(db, "products");

  getDocs(ref)
    .then(snapshot => {
      allProducts = snapshot.docs.map(d => {
        return {
          id: d.id,
          ...d.data()
        };
      });
    })
    .catch(err => {
      console.error("Error loading search data:", err);
    });
}
