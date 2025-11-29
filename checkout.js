import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

/* ---------------------------
  helpers & UI logic (unchanged)
----------------------------*/
function formatPrice(n) {
  return n.toLocaleString();
}

const deliveryFees = {
  Lagos: 4500,
  OutsideLagos: 5000,
};

let appliedDiscount = 0;
let couponApplied = false;

/* -----------------------------
  LOAD CHECKOUT SUMMARY
------------------------------*/
function loadCheckoutSummary() {
  const summaryContainer = document.getElementById("summaryItems");
  const totalEl = document.getElementById("grandTotal");
  const deliveryFeeEl = document.getElementById("deliveryFeeDisplay");
  const subtotalEl = document.getElementById("subtotalDisplay");
  const discountEl = document.getElementById("discountDisplay");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (!summaryContainer) return;

  if (cart.length === 0) {
    summaryContainer.innerHTML = "<p>Your cart is empty.</p>";
    if (totalEl) totalEl.textContent = "₦0";
    if (subtotalEl) subtotalEl.textContent = "₦0";
    if (discountEl) discountEl.textContent = "₦0";
    if (deliveryFeeEl) deliveryFeeEl.textContent = "-";
    return;
  }

  summaryContainer.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("item");

    const itemHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="details">
        <p><strong>${item.name}</strong></p>
        <p>Size: ${item.size}</p>
        <p>Qty: ${item.quantity}</p>
        <p>Price: ₦${formatPrice(item.price * item.quantity)}</p>
      </div>
    `;

    subtotal += item.price * item.quantity;
    itemDiv.innerHTML = itemHTML;
    summaryContainer.appendChild(itemDiv);
  });

  if (subtotalEl) subtotalEl.textContent = `₦${formatPrice(subtotal)}`;
  if (discountEl) discountEl.textContent = `₦${formatPrice(appliedDiscount)}`;

  const selectedArea = document.getElementById("deliveryArea")?.value;
  const deliveryFee = deliveryFees[selectedArea] || 0;

  if (deliveryFeeEl) {
    deliveryFeeEl.textContent = deliveryFee ? `₦${formatPrice(deliveryFee)}` : "-";
  }

  const finalTotal = subtotal - appliedDiscount + deliveryFee;
  if (totalEl) totalEl.textContent = `₦${formatPrice(finalTotal >= 0 ? finalTotal : 0)}`;
}

const areaSelect = document.getElementById("deliveryArea");
if (areaSelect) {
  areaSelect.addEventListener("change", loadCheckoutSummary);
}

/* -----------------------------
  COUPON APPLY
------------------------------*/
const applyBtn = document.getElementById("applyCouponBtn");
if (applyBtn) {
  applyBtn.addEventListener("click", async () => {
    const code = document.getElementById("couponInput").value.trim();
    const messageEl = document.getElementById("couponMessage");

    if (!code) {
      messageEl.textContent = "Please enter a coupon code.";
      messageEl.style.color = "red";
      return;
    }

    if (couponApplied) {
      messageEl.textContent = "A coupon has already been applied.";
      messageEl.style.color = "orange";
      return;
    }

    try {
      const couponRef = doc(db, "coupons", code);
      const docSnap = await getDoc(couponRef);

      if (!docSnap.exists()) {
        messageEl.textContent = "Invalid coupon.";
        messageEl.style.color = "red";
        return;
      }

      const data = docSnap.data();
      if (data.used) {
        messageEl.textContent = "Coupon already used.";
        messageEl.style.color = "orange";
        return;
      }

      appliedDiscount = data.amount || data.discount || 0;
      couponApplied = true;

      messageEl.textContent = `Coupon applied! ₦${formatPrice(appliedDiscount)} off.`;
      messageEl.style.color = "green";

      loadCheckoutSummary();
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Failed to apply coupon.";
      messageEl.style.color = "red";
    }
  });
}

window.addEventListener("DOMContentLoaded", loadCheckoutSummary);

/* -----------------------------
  NOTIFICATION
------------------------------*/
function showNotify(message, type = "success") {
  const notifyContainer = document.getElementById("notifyContainer");
  if (!notifyContainer) return;
  const notify = document.createElement("div");
  notify.className = `notify ${type}`;
  notify.innerText = message;
  notifyContainer.appendChild(notify);

  setTimeout(() => notify.remove(), 4000);
}

/* -----------------------------
  PAYSTACK
------------------------------*/
function payWithPaystack(email, amount, onSuccess, onFailure) {
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotify("❌ Invalid email passed to Paystack.", "error");
    return;
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    showNotify("❌ Invalid amount passed to Paystack.", "error");
    return;
  }

  const handler = PaystackPop.setup({
    key: 'pk_test_63726895d0ff99d1bf79d5bc412851cd63e3b3fa',
    email: email,
    amount: Math.floor(amount * 100),
    currency: "NGN",
    ref: '' + Math.floor(Math.random() * 1000000000 + 1),
    callback: function (response) {
      showNotify('Payment successful. Ref: ' + response.reference, 'success');
      onSuccess && onSuccess(response);
    },
    onClose: function () {
      showNotify('Transaction canceled', 'error');
      onFailure && onFailure();
    }
  });

  handler.openIframe();
}

/* ===================================================
   UPDATED TRANSACTION — NO FAIL WHEN OUT OF STOCK
   =================================================== */
async function processOrderTransaction(orderData, cart, paymentRef) {
  const ordersCol = collection(db, "orders");
  const orderDocRef = doc(ordersCol);

  try {
    await runTransaction(db, async (tx) => {
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await tx.get(productRef);

        if (!productSnap.exists()) {
          continue; // skip missing product
        }

        const pData = productSnap.data();
        const inventory = pData.inventory || {};
        const sizeKey = item.size;

        const currentQty = Number(inventory[sizeKey] ?? 0);

        // If stock is zero or less than requested → DO NOT FAIL
        if (currentQty <= 0) {
          continue; // Out of stock → skip inventory update
        }

        // Reduce quantity but never below zero
        const newQty = Math.max(0, currentQty - item.quantity);

        tx.update(productRef, { [`inventory.${sizeKey}`]: newQty });
      }

      tx.set(orderDocRef, {
        ...orderData,
        paymentRef,
        status: "paid",
        createdAt: serverTimestamp(),
      });
    });

    return { success: true, orderId: orderDocRef.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

/* ===================================================
   SUBMIT HANDLER
   =================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("emailInput")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const name = document.getElementById("name")?.value.trim();
    const address = document.getElementById("address")?.value.trim();
    const deliveryArea = document.getElementById("deliveryArea")?.value.trim();
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!email || cart.length === 0) {
      showNotify("Please enter a valid email and ensure your cart isn't empty.", "error");
      return;
    }

    if (!name || !address) {
      showNotify("Please enter your full name and address.", "error");
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = deliveryFees[deliveryArea] || 0;
    const grandTotal = subtotal - appliedDiscount + deliveryFee;

    const orderData = {
      name,
      address,
      email,
      items: cart,
      phone,
      deliveryArea,
      subtotal,
      discount: appliedDiscount,
      deliveryFee,
      total: grandTotal,
      timestamp: new Date().toISOString(),
    };

    payWithPaystack(
      email,
      grandTotal,
      async (response) => {
        const paymentRef = response.reference;

        const result = await processOrderTransaction(orderData, cart, paymentRef);

        if (!result.success) {
          showNotify("Order submitted but inventory sync had an issue. We will handle it manually.", "error");
        }

        // EMAIL SENDING (unchanged)
        try {
          const params = {
            user_name: name,
            user_email: email,
            phone,
            address,
            delivery_area: deliveryArea,
            order_summary: cart.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(", "),
            order_total: grandTotal.toLocaleString(),
            order_id: result.orderId || "N/A",
          };

          if (typeof emailjs !== "undefined") {
            emailjs.send("service_txzn1o7", "template_3sijx8l", params);
          }
        } catch (err) {
          console.error("EmailJS error:", err);
        }

        localStorage.removeItem("cart");
        window.location.href = "thank-you.html";
      },
      () => showNotify("Payment cancelled", "error")
    );
  });
});
