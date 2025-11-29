import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


//=============================
// GET PRODUCT ID
//=============================
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// DOM elements
const nameEl = document.getElementById("productName");
const priceEl = document.getElementById("productPrice");
const mainImageEl = document.getElementById("mainImage");
const sizeListEl = document.getElementById("sizeList");
const decreaseBtn = document.querySelector(".decrease");
const increaseBtn = document.querySelector(".increase");
const countEl = document.querySelector(".count");
const addToCartBtn = document.querySelector(".product-btn");

const previewContainer = document.querySelector(".images-preview");
const dotsContainer = document.querySelector(".slider-dots");
const imageContainer = document.querySelector(".product-page-image");

let quantity = 1;
let allImages = [];
let currentIndex = 0;
let inventory = {};       
let selectedSize = null;  


function updateCount() {
  countEl.textContent = quantity;
  decreaseBtn.classList.toggle("disabled", quantity === 1);
}


/* ======================================================
   LOAD PRODUCT FROM FIRESTORE
====================================================== */
async function loadProduct() {
  if (!productId) {
    nameEl.textContent = "Product not found.";
    return;
  }

  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      nameEl.textContent = "Product not found.";
      return;
    }

    const product = docSnap.data();

    nameEl.textContent = product.name;
    priceEl.textContent = `₦${product.price.toLocaleString()}`;
    mainImageEl.src = product.image;

    // Save inventory (correct key directly from Firestore)
    inventory = product.inventory || {};

    /* ======================================================
       LOAD SIZES + DISABLE 0 INVENTORY
    ====================================================== */
    if (product.sizes && Array.isArray(product.sizes)) {
      sizeListEl.innerHTML = "";

      product.sizes.forEach(size => {
        const stock = inventory[size] ?? 0;

        const li = document.createElement("li");
        li.innerHTML = `
          <a href="#" onclick="return false;" class="${stock === 0 ? "disabled-size" : ""}">
            ${size}
          </a>
        `;

        if (stock === 0) {
          const a = li.querySelector("a");
          a.style.opacity = "0.4";
          a.style.pointerEvents = "none";
        }

        sizeListEl.appendChild(li);
      });
    }

    /* ======================================================
       GALLERY IMAGES
    ====================================================== */
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      allImages = product.images;
    } else {
      allImages = [product.image];
    }

    generatePreviews();
    generateDots();

  } catch (err) {
    console.error("Failed to load product:", err);
    nameEl.textContent = "Error loading product.";
  }
}

loadProduct();
updateCount();



/* ======================================================
   LOAD RECOMMENDED PRODUCTS
====================================================== */
async function loadRecommended() {
  const recommendedContainer = document.getElementById("recommendedContainer");

  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("recommended", "==", true));

    const querySnapshot = await getDocs(q);

    recommendedContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const product = doc.data();
      const id = doc.id;

      const totalInventory = product.inventory
        ? Object.values(product.inventory).reduce((a, b) => a + b, 0)
        : 0;

      const card = document.createElement("div");
      card.className = "you-may-like-card";

      card.innerHTML = `
        <div class="you-may-like-image">
          <img src="${product.image}" class="main-image" />
          ${totalInventory === 0 ? '<span class="out-of-stock-badge">Out of Stock</span>' : ""}
        </div>

        <div class="you-may-like-details">
          <p class="you-may-like-name">${product.name}</p>
          <p class="you-may-like-price">₦${product.price.toLocaleString()}</p>
        </div>
      `;

      if (totalInventory > 0) {
        card.addEventListener("click", () => {
          window.location.href = `product-page.html?id=${id}`;
        });
      } else {
        card.classList.add("disabled-product");
      }

      recommendedContainer.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading recommended:", err);
  }
}

loadRecommended();




/* ======================================================
   PREVIEW GENERATION
====================================================== */
function generatePreviews() {
  previewContainer.innerHTML = "";

  allImages.forEach((img, index) => {
    const div = document.createElement("div");
    div.classList.add("previews");
    if (index === 0) div.classList.add("active");

    div.innerHTML = `<img src="${img}">`;
    previewContainer.appendChild(div);

    div.addEventListener("click", () => changeImage(index));
  });
}

function generateDots() {
  dotsContainer.innerHTML = "";

  allImages.forEach((img, index) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    dotsContainer.appendChild(dot);

    dot.addEventListener("click", () => changeImage(index));
  });
}


/* ======================================================
   CHANGE IMAGE
====================================================== */
function changeImage(index) {
  currentIndex = index;
  mainImageEl.src = allImages[index];

  document.querySelectorAll(".previews").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".previews")[index].classList.add("active");

  document.querySelectorAll(".dot").forEach(d => d.classList.remove("active"));
  document.querySelectorAll(".dot")[index].classList.add("active");
}


/* ======================================================
   SWIPE
====================================================== */
let startX = 0;
let isDown = false;

function handleSwipe(diff) {
  const threshold = 50;
  if (diff < -threshold && currentIndex < allImages.length - 1) changeImage(currentIndex + 1);
  if (diff > threshold && currentIndex > 0) changeImage(currentIndex - 1);
}

mainImageEl.addEventListener("touchstart", e => { startX = e.touches[0].clientX; isDown = true; });
mainImageEl.addEventListener("touchend", e => { isDown = false; handleSwipe(e.changedTouches[0].clientX - startX); });
mainImageEl.addEventListener("mousedown", e => { startX = e.clientX; isDown = true; });
mainImageEl.addEventListener("mouseup", e => { if (isDown) { handleSwipe(e.clientX - startX); isDown = false; } });



/* ======================================================
   ZOOM
====================================================== */
imageContainer.addEventListener("mousemove", (e) => {
  const rect = imageContainer.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  mainImageEl.style.transformOrigin = `${x}% ${y}%`;
  mainImageEl.style.transform = "scale(1.7)";
});

imageContainer.addEventListener("mouseleave", () => {
  mainImageEl.style.transformOrigin = "center center";
  mainImageEl.style.transform = "scale(1)";
});


/* ======================================================
   SIZE SELECTOR (FIXED!)
====================================================== */
sizeListEl.addEventListener("click", (e) => {
  if (e.target.tagName === "A" && !e.target.classList.contains("disabled-size")) {

    sizeListEl.querySelectorAll("a").forEach(a => a.classList.remove("active"));
    e.target.classList.add("active");

    // Extract size cleanly (🔥 FIXES YOUR ISSUE)
    selectedSize = e.target.textContent.replace(" (Out of stock)", "").trim();

    quantity = 1;
    updateCount();
  }
});


/* ======================================================
   QUANTITY CONTROL WITH CORRECT STOCK
====================================================== */
increaseBtn.addEventListener("click", () => {
  if (!selectedSize) return showNotification("Select a size first.");

  const stock = inventory[selectedSize] ?? 0;

  if (quantity < stock) {
    quantity++;
    updateCount();
  } else {
    showNotification(`Only ${stock} available.`);
  }
});

decreaseBtn.addEventListener("click", () => {
  if (quantity > 1) {
    quantity--;
    updateCount();
  }
});


/* ======================================================
   ADD TO CART (CORRECT STOCK)
====================================================== */
addToCartBtn.addEventListener("click", () => {
  if (!selectedSize) {
    showNotification("Please select a size.");
    return;
  }

  const stock = inventory[selectedSize] ?? 0;

  if (quantity > stock) {
    return showNotification(`Only ${stock} left in stock.`);
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingIndex = cart.findIndex(
    item => item.id === productId && item.size === selectedSize
  );

  if (existingIndex !== -1) {
    const newQty = cart[existingIndex].quantity + quantity;

    if (newQty > stock) {
      return showNotification(`Max allowed for this size is ${stock}.`);
    }

    cart[existingIndex].quantity = newQty;
  } 
  else {
    cart.push({
      id: productId,
      name: nameEl.textContent,
      price: parseInt(priceEl.textContent.replace(/[^0-9]/g, "")),
      image: mainImageEl.src,
      size: selectedSize,
      quantity: quantity
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showNotification("Added to cart");
  updateCartNumber();
});


/* ======================================================
   NOTIFICATION
====================================================== */
function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.remove("hidden");
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
    notification.classList.add("hidden");
  }, 2500);
}
