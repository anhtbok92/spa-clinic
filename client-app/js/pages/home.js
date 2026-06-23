/**
 * Home Page
 */
const HomePage = {
  services: [],
  categories: [],
  activeCategory: 'Tất cả',
  heroInterval: null,
  heroIndex: 0,

  async render(container) {
    container.innerHTML = this.getLoadingHTML();
    
    // Load services
    const result = await API.get('getServices');
    if (result.success) {
      this.services = result.data;
      this.categories = ['Tất cả', ...new Set(result.data.map(s => s.category))];
    }

    container.innerHTML = this.getHTML();
    this.bindEvents();
    this.startHeroSlider();
  },

  getLoadingHTML() {
    return `
      <div class="page">
        <div class="skeleton" style="height:280px;border-radius:0 0 24px 24px;"></div>
        <div style="padding:16px;">
          <div class="skeleton skeleton-line" style="width:40%;margin-top:24px;"></div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <div class="skeleton" style="width:80px;height:36px;border-radius:20px;"></div>
            <div class="skeleton" style="width:80px;height:36px;border-radius:20px;"></div>
            <div class="skeleton" style="width:80px;height:36px;border-radius:20px;"></div>
          </div>
          <div class="services-grid" style="margin-top:20px;">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
        </div>
      </div>
    `;
  },

  getHTML() {
    const filteredServices = this.activeCategory === 'Tất cả' 
      ? this.services 
      : this.services.filter(s => s.category === this.activeCategory);

    return `
      <div class="page">
        <!-- Hero Carousel -->
        <div class="hero-section">
          ${APP_CONFIG.HERO_IMAGES.map((img, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" 
                 style="background-image:url('${img}')"></div>
          `).join('')}
          <div class="hero-overlay">
            <h1 class="hero-title">${APP_CONFIG.SPA_NAME}</h1>
            <p class="hero-subtitle">${APP_CONFIG.SPA_TAGLINE}</p>
            <div class="hero-dots">
              ${APP_CONFIG.HERO_IMAGES.map((_, i) => `
                <div class="hero-dot ${i === 0 ? 'active' : ''}"></div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Categories -->
        <div class="section-header">
          <h2 class="section-title">Dịch vụ</h2>
          <a href="#" class="section-link" id="btn-view-all">Xem tất cả</a>
        </div>
        
        <div class="category-scroll">
          ${this.categories.map(cat => `
            <button class="category-chip ${cat === this.activeCategory ? 'active' : ''}" 
                    data-category="${cat}">${cat}</button>
          `).join('')}
        </div>

        <!-- Services Grid -->
        <div class="services-grid">
          ${filteredServices.length === 0 ? `
            <div class="empty-state" style="grid-column:1/-1;">
              <div class="empty-state-icon"><i class="fas fa-spa"></i></div>
              <p class="empty-state-text">Chưa có dịch vụ nào</p>
            </div>
          ` : filteredServices.map(service => `
            <div class="service-card" data-id="${service.service_id}">
              <div class="service-card-img" style="background-image:url('${service.image_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400'}')"></div>
              <div class="service-card-body">
                <h3 class="service-card-name">${service.name}</h3>
                <div class="service-card-meta">
                  <span class="service-card-price">${App.formatPrice(service.price)}</span>
                  <span class="service-card-duration"><i class="far fa-clock"></i> ${service.duration_min}p</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.category;
        const content = document.getElementById('main-content');
        content.innerHTML = this.getHTML();
        this.bindEvents();
        this.startHeroSlider();
      });
    });

    // Service card click → go to booking with pre-selected service
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => {
        const serviceId = card.dataset.id;
        App.navigateTo('booking', { preselectedService: serviceId });
      });
    });

    // View all
    const viewAllBtn = document.getElementById('btn-view-all');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        App.navigateTo('booking');
      });
    }
  },

  startHeroSlider() {
    if (this.heroInterval) clearInterval(this.heroInterval);
    
    this.heroInterval = setInterval(() => {
      const slides = document.querySelectorAll('.hero-slide');
      const dots = document.querySelectorAll('.hero-dot');
      if (!slides.length) return;

      slides[this.heroIndex].classList.remove('active');
      dots[this.heroIndex].classList.remove('active');
      
      this.heroIndex = (this.heroIndex + 1) % slides.length;
      
      slides[this.heroIndex].classList.add('active');
      dots[this.heroIndex].classList.add('active');
    }, 4000);
  }
};
