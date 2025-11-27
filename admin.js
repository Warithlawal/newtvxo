// ==============================
// FIREBASE IMPORTS
// ==============================
import { db, auth } from "./firebase.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";


// ==============================
// LOGOUT
// ==============================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });
}


// ==============================
// LOAD PRODUCTS IN REAL TIME
// ==============================
const loadProducts = () => {
    const productList = document.getElementById("productList");

    onSnapshot(collection(db, "products"), (snapshot) => {
        productList.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const p = docSnap.data();

            const item = document.createElement("div");
            item.classList.add("product-item");

            item.innerHTML = `
                <img src="${p.image}" />
                <h3>${p.name}</h3>
                <p>₦${p.price.toLocaleString()}</p>
                <p><strong>Category:</strong> ${p.category}</p>
                <p><strong>Discount:</strong> ${p.discount}%</p>
                <p><strong>Sizes:</strong> ${p.sizes.join(", ")}</p>
                <p><strong>Inventory:</strong> ${
                    Object.entries(p.inventory)
                        .map(([size, qty]) => `${size}: ${qty}`)
                        .join(" | ")
                }</p>

                <button class="edit-btn" data-id="${docSnap.id}">Edit</button>
                <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            `;

            productList.appendChild(item);
        });

        attachProductActions();
    });
};

loadProducts();


// ==============================
// DELETE PRODUCT
// ==============================
const attachProductActions = () => {
    const deleteBtns = document.querySelectorAll(".delete-btn");

    deleteBtns.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            await deleteDoc(doc(db, "products", id));
        });
    });
};


// ==============================
// ADD NEW PRODUCT
// ==============================
const addProductForm = document.getElementById("addProductForm");

if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("productName").value;
        const category = document.getElementById("productCategory").value;
        const price = Number(document.getElementById("productPrice").value);
        const discount = Number(document.getElementById("productDiscount").value);

        const image = document.getElementById("productImage").value;
        const hoverImage = document.getElementById("productHoverImage").value;

        const sizes = document.getElementById("productSizes").value.split(",");
        const images = document.getElementById("productImages").value.split(",");

        // Convert sizes to inventory map (default qty = 1)
        const inventory = {};
        sizes.forEach(s => { inventory[s] = 1 });

        await addDoc(collection(db, "products"), {
            name,
            category,
            price,
            discount,
            image,
            hoverImage,
            sizes,
            inventory,
            images,
            recommended: false,
            isFeaturedProduct: false
        });

        addProductForm.reset();
        alert("Product added!");
    });
}


// ==============================
// LOAD ORDERS
// ==============================
const loadOrders = () => {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;

    onSnapshot(collection(db, "orders"), (snapshot) => {
        ordersList.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const order = docSnap.data();

            const item = document.createElement("div");
            item.classList.add("order-item");

            item.innerHTML = `
                <h3>Order #${docSnap.id}</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>

                <div class="order-items">
                    ${order.items.map(i =>
                        `<p>${i.name} (${i.size}) — ${i.qty} pcs</p>`
                    ).join("")}
                </div>
            `;

            ordersList.appendChild(item);
        });
    });
};

loadOrders();




const links = document.querySelectorAll('aside nav a');
  const sections = document.querySelectorAll('main section');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.section;
      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(target).classList.add('active');
    });
  });

  // Product submenu
  const listSec = document.getElementById('productListSection');
  const addSec = document.getElementById('addProductSection');

  document.getElementById('showProductListBtn').onclick = () => {
    addSec.style.display = 'none';
    listSec.style.display = 'block';
  };
  document.getElementById('showAddProductBtn').onclick = () => {
    listSec.style.display = 'none';
    addSec.style.display = 'block';
  };

  document.getElementById('logoutBtn').onclick = () => {
    alert('Logged out');
    window.location.href = 'login.html';
  };