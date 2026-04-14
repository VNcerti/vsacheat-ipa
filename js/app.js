class AppManager {
    constructor() {
        this.currentCategory = 'all';
        this.currentView = 'home';
        this.allApps = [];
        this.searchTerm = '';
        this.featuredApps = [];
        
        this.initializeElements();
        this.bindEvents();
        this.init();
    }

    initializeElements() {
        this.appsGrid = document.getElementById('appsGrid');
        this.gamesGrid = document.getElementById('gamesGrid');
        this.gamesSection = document.getElementById('gamesSection');
        this.sectionTitle = document.getElementById('sectionTitle');
        this.categoryCards = document.querySelectorAll('.category-card');
        this.searchModal = document.getElementById('searchModal');
        this.searchModalInput = document.getElementById('searchModalInput');
        this.closeSearch = document.getElementById('closeSearch');
        this.searchResults = document.getElementById('searchResults');
        this.featuredCarousel = document.getElementById('featuredCarousel');
        this.featuredLoading = document.getElementById('featuredLoading');
    }

    bindEvents() {
        this.searchModalInput?.addEventListener('input', (e) => {
            this.searchApps(e.target.value.trim());
        });

        this.categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.currentCategory = category;
                this.categoryCards.forEach(c => {
                    c.classList.toggle('active', c.dataset.category === category);
                });
                if (this.currentView === 'games') {
                    this.currentView = 'home';
                    document.body.classList.remove('games-view');
                }
                this.renderApps();
            });
        });

        this.searchModal?.addEventListener('click', (e) => {
            if (e.target === this.searchModal) this.closeSearchModal();
        });
        this.closeSearch?.addEventListener('click', () => this.closeSearchModal());

        this.bindFeaturedCarouselEvents();
    }

    bindFeaturedCarouselEvents() {
        const prevArrow = document.querySelector('.nav-arrow.prev');
        const nextArrow = document.querySelector('.nav-arrow.next');
        const dots = document.querySelectorAll('.carousel-dot');

        prevArrow?.addEventListener('click', () => this.scrollFeaturedCarousel(-332));
        nextArrow?.addEventListener('click', () => this.scrollFeaturedCarousel(332));
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.scrollFeaturedCarouselToIndex(parseInt(dot.dataset.index));
            });
        });
    }

    init() {
        this.loadAppsFromSheets();
    }

    async loadAppsFromSheets() {
        try {
            AppUtils.showSkeletonLoading(this.appsGrid);
            
            if (AppUtils.isCacheValid()) {
                const cachedApps = AppUtils.getFromCache();
                if (cachedApps?.length > 0) {
                    this.allApps = cachedApps;
                    this.renderApps();
                    this.loadFeaturedApps();
                    this.fetchFreshData();
                    return;
                }
            }
            await this.fetchFreshData();
        } catch (error) {
            console.error('Error:', error);
            const cachedApps = AppUtils.getFromCache();
            if (cachedApps?.length > 0) {
                this.allApps = cachedApps;
                this.renderApps();
                this.loadFeaturedApps();
            }
        }
    }

    async fetchFreshData() {
        try {
            const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getApps&t=${Date.now()}`);
            const result = await response.json();
            if (result.success) {
                this.allApps = result.data.map(app => {
                    if (!app.categories) app.categories = 'other';
                    return app;
                });
                AppUtils.saveToCache(this.allApps);
                this.renderApps();
                this.loadFeaturedApps();
                console.log('✅ Data loaded, total:', this.allApps.length);
                console.log('🎮 Games:', this.allApps.filter(a => a.categories?.includes('game')).length);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    openSearchModal() {
        this.searchModal.style.display = 'block';
        setTimeout(() => this.searchModalInput?.focus(), 100);
    }

    closeSearchModal() {
        this.searchModal.style.display = 'none';
        if (this.searchModalInput) this.searchModalInput.value = '';
        if (this.searchResults) this.searchResults.innerHTML = '';
        document.body.classList.remove('search-mode');
    }

    searchApps(searchTerm) {
        if (!searchTerm.trim()) {
            this.searchResults.innerHTML = '<div class="no-results"><p>Nhập từ khóa để tìm kiếm</p></div>';
            return;
        }
        const filteredApps = this.allApps.filter(app => 
            app.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        if (filteredApps.length === 0) {
            this.searchResults.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>Không tìm thấy ứng dụng nào bắt đầu bằng "${searchTerm}"</p></div>`;
        } else {
            this.displayApps(filteredApps, this.searchResults);
        }
    }

    // Hàm sắp xếp apps theo thời gian (mới nhất lên đầu)
    sortAppsByDate(apps) {
        return [...apps].sort((a, b) => {
            // Ưu tiên sắp xếp theo updatedate (ngày cập nhật)
            const dateA = a.updatedate ? new Date(a.updatedate) : new Date(0);
            const dateB = b.updatedate ? new Date(b.updatedate) : new Date(0);
            
            // Nếu có ngày hợp lệ thì so sánh
            if (!isNaN(dateA) && !isNaN(dateB)) {
                return dateB - dateA;
            }
            
            // Nếu không có ngày thì sắp xếp theo id
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            return idB - idA;
        });
    }

    renderApps() {
        let filteredApps = this.filterApps();
        
        // Sắp xếp apps theo thời gian upload gần nhất
        filteredApps = this.sortAppsByDate(filteredApps);
        
        this.updateSectionTitle();
        this.displayApps(filteredApps, this.appsGrid);
        
        // Lấy danh sách game và sắp xếp theo thời gian upload gần nhất
        let games = this.allApps.filter(app => app.categories?.includes('game'));
        games = this.sortAppsByDate(games);
        
        console.log('🎮 Games rendered, count:', games.length);
        console.log('🎮 Latest game:', games[0]?.name, '| Date:', games[0]?.updatedate);
        
        this.displayApps(games, this.gamesGrid);
    }

    filterApps() {
        let filteredApps = this.allApps;
        
        if (this.currentView === 'games') {
            filteredApps = this.allApps.filter(app => app.categories?.includes('game'));
        } else if (this.currentView === 'home' && this.currentCategory !== 'all') {
            filteredApps = this.allApps.filter(app => app.categories?.includes(this.currentCategory));
        }
        
        if (this.searchTerm) {
            filteredApps = filteredApps.filter(app => 
                app.name.toLowerCase().startsWith(this.searchTerm.toLowerCase())
            );
        }
        
        return filteredApps;
    }

    updateSectionTitle() {
        let title = 'Ứng dụng mới';
        if (this.searchTerm) {
            title = `Kết quả tìm kiếm: "${this.searchTerm}"`;
        } else if (this.currentView === 'games') {
            title = 'Trò chơi';
        } else if (this.currentCategory !== 'all') {
            const labels = { 
                'game': 'Trò chơi', 
                'social': 'Mạng xã hội', 
                'entertainment': 'Giải trí', 
                'photo': 'Ảnh & Video', 
                'clone': 'Nhân bản', 
                'premium': 'Premium', 
                'education': 'Giáo dục', 
                'health': 'Sức khỏe', 
                'utility': 'Tiện ích' 
            };
            title = labels[this.currentCategory] || this.currentCategory;
        }
        if (this.sectionTitle) this.sectionTitle.textContent = title;
    }
    
    switchToGamesView() {
        console.log('🎮 Switch to games view');
        this.currentView = 'games';
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.categoryCards.forEach(c => {
            c.classList.toggle('active', c.dataset.category === 'all');
        });
        this.renderApps();
    }
    
    switchToHomeView() {
        console.log('🏠 Switch to home view');
        this.currentView = 'home';
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.categoryCards.forEach(c => {
            c.classList.toggle('active', c.dataset.category === 'all');
        });
        this.renderApps();
    }

    displayApps(apps, container) {
        if (!container) return;
        container.innerHTML = '';
        
        if (apps.length === 0) {
            let msg = 'Không có ứng dụng nào.';
            if (this.currentView === 'games') msg = 'Chưa có trò chơi nào.';
            AppUtils.showNoResults(container, msg);
            return;
        }
        
        apps.forEach(app => {
            container.appendChild(this.createAppCard(app));
        });
    }

    createAppCard(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        
        let version = (app.version || '1.0.0').replace(/^'/, '');
        const descHTML = this.createDescHTML(app.description);
        const date = AppUtils.formatDate(app.updatedate);
        
        card.innerHTML = `
            <img src="${app.image}" class="app-logo" loading="lazy"
                 onclick="window.open('app-detail.html?id=${app.id}', '_self')"
                 onerror="this.src='https://via.placeholder.com/70/2563eb/FFFFFF?text=App'">
            <div class="app-content">
                <div class="app-header">
                    <div class="app-info">
                        <div class="app-name" onclick="window.open('app-detail.html?id=${app.id}', '_self')">${this.escapeHtml(app.name)}</div>
                        <div class="app-version-meta"><div class="app-meta-item"><i class="fas fa-code-branch"></i><span>Version : ${version}</span></div></div>
                        <div class="app-meta"><div class="app-meta-item"><i class="fas fa-clock"></i><span>${date}</span></div></div>
                    </div>
                    <div class="app-actions"><button class="index-download-btn" onclick="window.open('app-detail.html?id=${app.id}', '_self')">NHẬN</button></div>
                </div>
                ${descHTML}
            </div>
        `;
        return card;
    }

    createDescHTML(desc) {
        if (!desc) return '<div class="app-description-check"></div>';
        const lines = desc.split('\n').filter(l => l.trim());
        if (!lines.length) return '<div class="app-description-check"></div>';
        
        let html = '<div class="app-description-check">';
        lines.slice(0, 2).forEach(line => {
            html += `<div class="description-item"><div class="check-icon-container"></div><div class="description-text">${this.escapeHtml(line.trim())}</div></div>`;
        });
        html += '</div>';
        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Featured Apps
    loadFeaturedApps() {
        if (!this.allApps.length) return;
        // Sắp xếp featured apps theo ngày mới nhất
        const newest = this.sortAppsByDate(this.allApps).slice(0, 20);
        this.featuredApps = this.getRandomApps(newest, 5);
        this.displayFeaturedApps();
        this.initFeaturedCarousel();
    }

    getRandomApps(arr, count) {
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
    }

    getBadge(i) {
        const types = ['premium', 'hot', 'new', 'trending', 'vip'];
        const labels = ['PREMIUM', 'HOT', 'NEW', 'TRENDING', 'VIP'];
        return { type: types[i%5], label: labels[i%5] };
    }

    createFeaturedCard(app, idx) {
        const card = document.createElement('div');
        card.className = 'featured-card';
        const badge = this.getBadge(idx);
        const desc = app.description?.split('\n')[0] || 'Mô tả ứng dụng...';
        const rating = [4.0,4.3,4.5,4.7,4.9,5.0][Math.floor(Math.random()*6)];
        
        card.innerHTML = `
            <img src="https://i.imgur.com/PwYQMpr.gif" class="featured-background">
            <div class="featured-overlay"></div>
            <div class="featured-badge badge-${badge.type}">${badge.label}</div>
            <div class="featured-content">
                <div class="featured-logo-container"><img src="${app.image}" class="featured-logo" onerror="this.src='https://via.placeholder.com/46/2563eb/FFFFFF?text=App'"></div>
                <div class="featured-text-content">
                    <div class="featured-name">${this.escapeHtml(app.name)}</div>
                    <div class="featured-description">${this.escapeHtml(desc.substring(0,60))}</div>
                    <div class="featured-rating"><i class="fas fa-star"></i><span>${rating}</span></div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => window.open(`app-detail.html?id=${app.id}`, '_self'));
        return card;
    }

    displayFeaturedApps() {
        if (!this.featuredApps.length) return;
        if (this.featuredLoading) this.featuredLoading.style.display = 'none';
        this.featuredApps.forEach((app, i) => {
            if (this.featuredCarousel) this.featuredCarousel.appendChild(this.createFeaturedCard(app, i));
        });
    }

    initFeaturedCarousel() {
        const container = this.featuredCarousel;
        if (!container || !this.featuredApps.length) return;
        
        const updateArrows = () => {
            const sl = container.scrollLeft, max = container.scrollWidth - container.clientWidth;
            const prev = document.querySelector('.nav-arrow.prev');
            const next = document.querySelector('.nav-arrow.next');
            if (prev) prev.style.display = sl > 0 ? 'flex' : 'none';
            if (next) next.style.display = sl < max - 10 ? 'flex' : 'none';
        };
        
        const updateDots = () => {
            const idx = Math.round(container.scrollLeft / 332);
            document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
        };
        
        container.addEventListener('scroll', () => { updateArrows(); updateDots(); });
        updateArrows();
        setInterval(() => {
            const active = document.querySelector('.carousel-dot.active');
            const next = active?.nextElementSibling || document.querySelector('.carousel-dot');
            if (next) next.click();
        }, 5000);
    }

    scrollFeaturedCarousel(amount) {
        this.featuredCarousel?.scrollBy({ left: amount, behavior: 'smooth' });
    }

    scrollFeaturedCarouselToIndex(idx) {
        this.featuredCarousel?.scrollTo({ left: idx * 332, behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
});