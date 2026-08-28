'use strict';

/* ==========================================================================
   Data & Constants
   ========================================================================== */
const PRODUCTS = [
  { id: 'p01', name: 'Lunar Heart', price: 99000, originalPrice: null, category: '𝑺𝑾𝑬𝑬𝑻 𝑮𝑶𝑻𝑯𝑰𝑪 𝑾𝑯𝑰𝑴𝑺𝒀', image: 'Lunar Heart.jpg', description: 'Wishbag' },
  { id: 'p02', name: 'Lace Bound', price: 99000, originalPrice: null, category: '𝑺𝑾𝑬𝑬𝑻 𝑮𝑶𝑻𝑯𝑰𝑪 𝑾𝑯𝑰𝑴𝑺𝒀', image: 'Lace Bound.jpg', description: 'Wishbag' },
  { id: 'p03', name: 'Pinky Promise', price: 99000, originalPrice: null, category: '𝑺𝑾𝑬𝑬𝑻 𝑮𝑶𝑻𝑯𝑰𝑪 𝑾𝑯𝑰𝑴𝑺𝒀', image: 'Pinky Promise.jpg', description: 'Wishbag' },
  { id: 'p08', name: 'Gift Basket', price: 99000, originalPrice: null, category: '𝑺𝑾𝑬𝑬𝑻 𝑮𝑶𝑻𝑯𝑰𝑪 𝑾𝑯𝑰𝑴𝑺𝒀', image: 'gift basket .jpg', description: 'Wishbag', isSoldOut: true },
  { id: 'p09', name: 'Quiet Bloom', price: 99000, originalPrice: null, category: '𝑺𝑾𝑬𝑬𝑻 𝑮𝑶𝑻𝑯𝑰𝑪 𝑾𝑯𝑰𝑴𝑺𝒀', image: 'Quiet Bloom (hết hàng).jpg', description: 'Wishbag', isSoldOut: true },
  { id: 'p10', name: 'Jeanius - example', price: 199000, originalPrice: null, category: 'Jean Collection', image: 'Jeanius - example.jpg', description: 'Mỗi sản phẩm trong Jean Collection sẽ khác nhau, nên hình ảnh trên là hình ảnh minh họa' },
  { id: 'p04', name: 'Aloha', price: 99000, originalPrice: null, category: 'Summer Threads', image: 'Aloha.jpg', description: 'Wishbag' },
  { id: 'p05', name: 'Gentle Giant', price: 99000, originalPrice: null, category: 'Summer Threads', image: 'Gentle Giant.jpg', description: 'Wishbag' },
  { id: 'p06', name: 'Ripple', price: 129000, originalPrice: null, category: 'Summer Threads', image: 'Ripple.jpg', description: 'Wishbag' },
  { id: 'p07', name: 'Sunny Side', price: 99000, originalPrice: null, category: 'Summer Threads', image: 'Sunny Side.jpg', description: 'Wishbag' },
];

const CART_STORAGE_KEY = 'wishbag_cart_v1';
const USER_INFO_KEY = 'wishbag_user_info'; 
const ORDER_COUNTER_KEY = 'wishbag_booth_order_counter'; // Lưu số đếm bill tại gian hàng
const SHIPPING_FLAT_RATE = 30000;
const FREE_SHIPPING_THRESHOLD = 500000;
const TOAST_DURATION_MS = 4000;

/* ==========================================================================
   State
   ========================================================================== */
let cart = loadCart();
let activeCategory = 'all';
let activeSort = 'default';
let searchTerm = '';
let isAtBooth = false; // Trạng thái: Mua trực tiếp tại gian hàng

/* ==========================================================================
   Utilities
   ========================================================================== */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
function formatMoney(amount) { return amount.toLocaleString('vi-VN') + ' VNĐ'; }
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item.id === 'string' && typeof item.quantity === 'number' && item.quantity > 0);
  } catch (err) { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (err) {}
}
function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

/* ==========================================================================
   DOM references
   ========================================================================== */
const productGrid = document.getElementById('product-grid');
const emptyState = document.getElementById('empty-state');
const resultsStatus = document.getElementById('results-status');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categoryTabs = document.querySelector('.category-tabs');

const cartOpenBtn = document.getElementById('cart-open-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartDrawer = document.getElementById('cart-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const cartBadge = document.getElementById('cart-badge');
const cartItemsList = document.getElementById('cart-items-list');
const cartEmptyState = document.getElementById('cart-empty-state');
const cartFooter = document.getElementById('cart-footer');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartShippingEl = document.getElementById('cart-shipping');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const cartEmptyShopLink = document.getElementById('cart-empty-shop-link');
const toastContainer = document.getElementById('toast-container');
const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('main-nav-mobile');
const backToTopBtn = document.getElementById('back-to-top');

const checkoutModalTotal = document.getElementById('checkout-modal-total');

/* ==========================================================================
   Hero Slider
   ========================================================================== */
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.slider-nav.prev');
const nextBtn = document.querySelector('.slider-nav.next');
const heroSection = document.getElementById('hero');
let currentSlide = 0;
let slideInterval;

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  if (index >= slides.length) currentSlide = 0;
  if (index < 0) currentSlide = slides.length - 1;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}
function nextSlide() { currentSlide++; showSlide(currentSlide); }
function prevSlide() { currentSlide--; showSlide(currentSlide); }
function startSlideShow() { slideInterval = setInterval(nextSlide, 5000); }
function stopSlideShow() { clearInterval(slideInterval); }

if (slides.length > 0 && heroSection) {
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); stopSlideShow(); startSlideShow(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); stopSlideShow(); startSlideShow(); });
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentSlide = parseInt(e.target.getAttribute('data-index'));
      showSlide(currentSlide); stopSlideShow(); startSlideShow();
    });
  });
  startSlideShow(); 
}

/* ==========================================================================
   Product rendering
   ========================================================================== */
function getVisibleProducts() {
  let list = PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  if (activeSort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  else if (activeSort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function renderProductCard(product) {
  const isSoldOut = product.isSoldOut === true; 
  let badgeMarkup = '';
  let soldOutStampMarkup = '';
  if (isSoldOut) {
    badgeMarkup = `<span class="product-badge sold-out-badge">Hết Hàng</span>`;
    soldOutStampMarkup = `<div class="sold-out-stamp">SOLD OUT</div>`;
  }
  const cardClass = isSoldOut ? 'product-card is-sold-out' : 'product-card';
  const buttonMarkup = isSoldOut
    ? `<button type="button" class="add-to-cart-btn sold-out-btn" disabled>Hết hàng</button>`
    : `<button type="button" class="add-to-cart-btn" data-action="add-to-cart" data-product-id="${sanitize(product.id)}" aria-label="Thêm ${sanitize(product.name)} vào giỏ">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17.5" cy="20.5" r="1.4" fill="currentColor"/></svg>
        Thêm vào giỏ
      </button>`;

  return `
    <article class="${cardClass}" data-product-id="${sanitize(product.id)}">
      <div class="product-media">
        ${badgeMarkup}${soldOutStampMarkup}
        <img src="${sanitize(product.image)}" alt="${sanitize(product.name)}" loading="lazy" width="400" height="400" onerror="this.src='https://via.placeholder.com/400x400?text=Wishbag';">
      </div>
      <div class="product-body">
        <span class="product-category">${sanitize(product.category)}</span>
        <h3 class="product-title">${sanitize(product.name)}</h3>
        <p class="product-desc">${sanitize(product.description)}</p>
        <div class="product-price-row">
          <span class="product-price">${formatMoney(product.price)}</span>
        </div>
        ${buttonMarkup}
      </div>
    </article>
  `;
}

function renderProducts() {
  const visible = getVisibleProducts();
  if (visible.length === 0) {
    productGrid.innerHTML = ''; emptyState.hidden = false;
  } else {
    emptyState.hidden = true; productGrid.innerHTML = visible.map(renderProductCard).join('');
  }
}

/* ==========================================================================
   Cart rendering & Logic
   ========================================================================== */
function getCartLines() {
  return cart.map(entry => {
    const product = findProduct(entry.id);
    if (!product) return null;
    return { ...product, quantity: entry.quantity };
  }).filter(Boolean);
}

function getCartTotals(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  // PHÍ SHIP: Miễn phí nếu mua tại gian hàng (isAtBooth = true) hoặc đạt ngưỡng freeship
  const shipping = (itemCount === 0 || subtotal >= FREE_SHIPPING_THRESHOLD || isAtBooth) ? 0 : SHIPPING_FLAT_RATE;
  return { subtotal, shipping, total: subtotal + shipping, itemCount };
}

function renderCartItem(line) {
  return `
    <li class="cart-item" data-product-id="${sanitize(line.id)}">
      <div class="cart-item-thumb">
        <img src="${sanitize(line.image)}" alt="${sanitize(line.name)}" loading="lazy" width="64" height="64" onerror="this.src='https://via.placeholder.com/64x64?text=WB';">
      </div>
      <div class="cart-item-info">
        <p class="cart-item-title">${sanitize(line.name)}</p>
        <p class="cart-item-price">${formatMoney(line.price)} / cái</p>
        <div class="qty-control">
          <button type="button" class="qty-btn" data-action="decrease" data-product-id="${sanitize(line.id)}">−</button>
          <span class="qty-value">${line.quantity}</span>
          <button type="button" class="qty-btn" data-action="increase" data-product-id="${sanitize(line.id)}">+</button>
        </div>
      </div>
      <button type="button" class="cart-item-remove" data-action="remove" data-product-id="${sanitize(line.id)}">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </li>
  `;
}

function renderCart() {
  const lines = getCartLines();
  const totals = getCartTotals(lines);
  if (cartBadge) cartBadge.textContent = String(totals.itemCount);
  
  if (lines.length === 0) {
    if (cartEmptyState) cartEmptyState.style.display = 'flex';
    if (cartItemsList) cartItemsList.innerHTML = '';
    if (cartFooter) cartFooter.hidden = true;
  } else {
    if (cartEmptyState) cartEmptyState.style.display = 'none';
    if (cartItemsList) cartItemsList.innerHTML = lines.map(renderCartItem).join('');
    if (cartFooter) cartFooter.hidden = false;
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(totals.subtotal);
    if (cartShippingEl) cartShippingEl.textContent = totals.shipping === 0 ? 'Miễn phí' : formatMoney(totals.shipping);
    
    // Cập nhật giá trị hiển thị thành tiền
    if (cartTotalEl) cartTotalEl.textContent = formatMoney(totals.total);
    if (checkoutModalTotal) checkoutModalTotal.textContent = formatMoney(totals.total);
  }
  saveCart();
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;
  const existing = cart.find(entry => entry.id === productId);
  if (existing) existing.quantity += 1; else cart.push({ id: productId, quantity: 1 });
  renderCart(); showToast(`✅ Đã thêm ${product.name} vào giỏ!`);
}

function changeQuantity(productId, delta) {
  const entry = cart.find(item => item.id === productId);
  if (!entry) return;
  entry.quantity += delta;
  if (entry.quantity <= 0) cart = cart.filter(item => item.id !== productId);
  renderCart();
}

/* ==========================================================================
   Toast, Drawer & Modals
   ========================================================================== */
function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${sanitize(message)}</span>`;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, TOAST_DURATION_MS);
}

function openCartDrawer() {
  if (cartDrawer) cartDrawer.classList.add('is-open');
  if (drawerOverlay) { drawerOverlay.hidden = false; requestAnimationFrame(() => drawerOverlay.classList.add('is-visible')); }
}
function closeCartDrawer() {
  if (cartDrawer) cartDrawer.classList.remove('is-open');
  if (drawerOverlay) { drawerOverlay.classList.remove('is-visible'); setTimeout(() => { drawerOverlay.hidden = true; }, 300); }
}

/* ==========================================================================
   Checkout Modal & Auto-fill Logic
   ========================================================================== */
const checkoutOverlay = document.getElementById('checkout-overlay');
const checkoutCloseBtn = document.getElementById('checkout-close-btn');
const checkoutForm = document.getElementById('checkout-form');
const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');

const transferInfo = document.getElementById('transfer-info');
const receiptUploadGroup = document.getElementById('receipt-upload-group');
const coReceipt = document.getElementById('co-receipt');
const labelCodText = document.getElementById('label-cod-text');
const customerInfoSection = document.getElementById('customer-info-section');

const coName = document.getElementById('co-name');
const coPhone = document.getElementById('co-phone');
const coAddress = document.getElementById('co-address');

function loadCheckoutInfo() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (raw) {
      const info = JSON.parse(raw);
      if (coName) coName.value = info.name || '';
      if (coPhone) coPhone.value = info.phone || '';
      if (coAddress) coAddress.value = info.address || '';
    }
  } catch (e) {}
}

function updateQRCode() {
  const totals = getCartTotals(getCartLines());
  const amount = totals.total; 
  const addInfo = encodeURIComponent('Thanh toan Wishbag');
  const qrUrl = `https://img.vietqr.io/image/vietcombank-1048131877-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=HOANG%20NGOC%20DIEU%20ANH`;
  const qrImage = document.querySelector('.qr-image');
  if (qrImage) qrImage.src = qrUrl;
}

// Lắng nghe thay đổi "Hình thức mua hàng" (Giao tận nơi / Mua tại gian hàng)
if (orderTypeRadios) {
  orderTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      isAtBooth = (e.target.value === 'booth');
      
      // Update lại giỏ hàng và mã QR theo số tiền mới (Không phí ship)
      renderCart();
      updateQRCode();

      if (isAtBooth) {
        // Ẩn form thông tin khách hàng, bỏ bắt buộc
        if(customerInfoSection) customerInfoSection.style.display = 'none';
        if(coName) coName.required = false;
        if(coPhone) coPhone.required = false;
        if(coAddress) coAddress.required = false;
        
        // Đổi tên nhãn thanh toán thành Tiền mặt
        if(labelCodText) labelCodText.textContent = 'Thanh toán tiền mặt tại gian hàng';
        
        // Ẩn upload bill (nhân viên tự check tiền)
        if(receiptUploadGroup) receiptUploadGroup.style.display = 'none';
        if(coReceipt) coReceipt.required = false;
      } else {
        // Hiện lại form thông tin khách hàng, đặt bắt buộc
        if(customerInfoSection) customerInfoSection.style.display = 'block';
        if(coName) coName.required = true;
        if(coPhone) coPhone.required = true;
        if(coAddress) coAddress.required = true;

        if(labelCodText) labelCodText.textContent = 'Thanh toán tiền mặt khi nhận hàng (COD)';
        
        // Nếu đang chọn chuyển khoản thì phải hiện lại nút upload biên lai (không bắt buộc nữa)
        if (document.querySelector('input[name="payment_method"]:checked').value === 'transfer') {
          if(receiptUploadGroup) receiptUploadGroup.style.display = 'block';
          if(coReceipt) coReceipt.required = false;
        }
      }
    });
  });
}

// Lắng nghe thay đổi Phương thức thanh toán (Tiền mặt / Chuyển khoản)
if (paymentRadios) {
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'transfer') {
        if(transferInfo) transferInfo.hidden = false;
        // Chỉ hiện nút upload biên lai nếu là Giao tận nơi (không bắt buộc)
        if (!isAtBooth) {
          if(receiptUploadGroup) receiptUploadGroup.style.display = 'block';
          if(coReceipt) coReceipt.required = false;
        } else {
          if(receiptUploadGroup) receiptUploadGroup.style.display = 'none';
          if(coReceipt) coReceipt.required = false;
        }
      } else {
        if(transferInfo) transferInfo.hidden = true;
        if(coReceipt) coReceipt.required = false;
      }
    });
  });
}

function openCheckoutModal() {
  if (checkoutOverlay) {
    loadCheckoutInfo(); 
    updateQRCode(); 
    checkoutOverlay.hidden = false;
    requestAnimationFrame(() => checkoutOverlay.classList.add('is-visible'));
    closeCartDrawer();
  }
}
function closeCheckoutModal() {
  if (checkoutOverlay) {
    checkoutOverlay.classList.remove('is-visible');
    setTimeout(() => { checkoutOverlay.hidden = true; }, 300);
  }
}

if (checkoutBtn) checkoutBtn.addEventListener('click', () => { if (getCartLines().length > 0) openCheckoutModal(); });
if (checkoutCloseBtn) checkoutCloseBtn.addEventListener('click', closeCheckoutModal);

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Đang xử lý...';
    submitBtn.style.opacity = '0.7'; submitBtn.style.pointerEvents = 'none'; 
    
    // Đọc mã Bill hiện tại
    let currentBillNum = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) || '1', 10);
    
    const paymentMethodValue = document.querySelector('input[name="payment_method"]:checked').value;
    const paymentStr = paymentMethodValue === 'transfer' ? 'Chuyển khoản QR' : (isAtBooth ? 'Tiền mặt' : 'COD (Giao hàng)');
    const orderTypeStr = isAtBooth ? `Mua tại gian hàng (Mã Bill: #${currentBillNum})` : 'Giao hàng tận nơi';

    const orderData = {
      Loại_đơn: orderTypeStr,
      Khách_hàng: (!isAtBooth && coName) ? coName.value : 'Khách vãng lai (Gian hàng)',
      Số_điện_thoại: (!isAtBooth && coPhone) ? coPhone.value : 'Không có',
      Địa_chỉ: (!isAtBooth && coAddress) ? coAddress.value : 'Tại gian hàng',
      Thanh_toán: paymentStr,
      Tổng_tiền: cartTotalEl ? cartTotalEl.textContent : '0 VNĐ',
      Chi_tiết_đơn_hàng: cart.map(item => {
        const p = findProduct(item.id);
        return p ? `${p.name} (Số lượng: ${item.quantity})` : '';
      }).join(' | ')
    };

    fetch("https://formspree.io/f/mzdnyylo", {
      method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    }).then(response => {
      if (response.ok) {
        if (!isAtBooth && coName && coPhone && coAddress) {
          saveCheckoutInfo(coName.value, coPhone.value, coAddress.value);
        }
        
        cart = []; renderCart(); closeCheckoutModal(); checkoutForm.reset();
        
        if (isAtBooth) {
          showToast(`🎉 Xong đơn Bill #${currentBillNum}!`);
          localStorage.setItem(ORDER_COUNTER_KEY, currentBillNum + 1); // Tăng số thứ tự bill lên 1
          
          // Reset lại state sau khi mua xong
          isAtBooth = false;
          document.querySelector('input[name="order_type"][value="delivery"]').checked = true;
          if(customerInfoSection) customerInfoSection.style.display = 'block';
          if(transferInfo) transferInfo.hidden = true;
          
        } else {
          showToast('🎉 Đặt hàng thành công! Wishbag sẽ liên hệ sớm.');
        }
        
      } else {
        showToast('❌ Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    }).catch(error => { showToast('❌ Lỗi kết nối, vui lòng kiểm tra mạng!');
    }).finally(() => {
      submitBtn.innerText = originalText; submitBtn.style.opacity = '1'; submitBtn.style.pointerEvents = 'auto';
    });
  });
}

/* ==========================================================================
   Event delegation
   ========================================================================== */
if (productGrid) {
  productGrid.addEventListener('click', event => {
    const btn = event.target.closest('[data-action="add-to-cart"]');
    if (btn) addToCart(btn.dataset.productId);
  });
}
if (cartItemsList) {
  cartItemsList.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const { action, productId } = actionEl.dataset;
    if (action === 'increase') changeQuantity(productId, 1);
    if (action === 'decrease') changeQuantity(productId, -1);
    if (action === 'remove') { cart = cart.filter(i => i.id !== productId); renderCart(); }
  });
}
if (categoryTabs) {
  categoryTabs.addEventListener('click', event => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    [...categoryTabs.querySelectorAll('.tab-btn')].forEach(tab => tab.classList.toggle('is-active', tab === btn));
    renderProducts();
  });
}
if (sortSelect) sortSelect.addEventListener('change', () => { activeSort = sortSelect.value; renderProducts(); });

if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCartDrawer);
if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeCartDrawer);

if (backToTopBtn) {
  window.addEventListener('scroll', () => backToTopBtn.classList.toggle('is-visible', window.scrollY > 300));
  backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

renderProducts();
renderCart();