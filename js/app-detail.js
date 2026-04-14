// app-detail.js - JavaScript cho trang chi tiết ứng dụng (WKWebView)
class AppDetailManager {
    constructor() {
        this.GOOGLE_SCRIPT_URL = CONFIG.GOOGLE_SCRIPT_URL;
        this.urlInfo = this.parseUrlId();
        this.appId = this.urlInfo ? this.urlInfo.id : null;
        this.appNameFromUrl = this.urlInfo ? this.urlInfo.name : null;
        this.retryCount = 0;
        this.MAX_RETRIES = 3;
        this.currentAppData = null;
        
        // AUTO REFRESH SYSTEM
        this.autoRefreshInterval = null;
        this.lastRefreshTime = null;
        
        this.VIP_PACKAGE_LABELS = {
            'trial': { name: 'Trial', icon: 'fas fa-star', color: '#10b981' },
            'basic': { name: 'Basic', icon: 'fas fa-crown', color: '#3b82f6' },
            'plus': { name: 'Plus', icon: 'fas fa-crown', color: '#8b5cf6' },
            'premium': { name: 'Premium', icon: 'fas fa-crown', color: '#f59e0b' },
            'all': { name: 'Tất cả gói', icon: 'fas fa-layer-group', color: '#6366f1' }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.init();
    }
    
    initializeElements() {
        this.appContent = document.getElementById('appContent');
        this.loginPrompt = document.getElementById('loginPrompt');
        this.shareBtnContainer = document.getElementById('shareBtnContainer');
        this.debugInfo = document.getElementById('debugInfo');
        this.debugContent = document.getElementById('debugContent');
        this.alertOverlay = document.getElementById('customAlertOverlay');
    }
    
    bindEvents() {
        // Alert overlay click
        this.alertOverlay.addEventListener('click', (e) => {
            if (e.target === this.alertOverlay) {
                this.alertOverlay.style.display = 'none';
            }
        });
        
        // Escape key to close alert
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.alertOverlay.style.display === 'flex') {
                this.alertOverlay.style.display = 'none';
            }
        });
        
        // Download button click effects
        document.addEventListener('click', (e) => {
            const downloadBtn = e.target.closest('.download-btn, .key-btn');
            if (downloadBtn && !downloadBtn.disabled) {
                const originalHTML = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
                downloadBtn.disabled = true;
                
                setTimeout(() => {
                    downloadBtn.innerHTML = originalHTML;
                    downloadBtn.disabled = false;
                }, 1500);
            }
        });
        
        // Auto refresh khi rời trang
        window.addEventListener('beforeunload', () => {
            this.stopAutoRefresh();
        });
    }
    
    init() {
        console.log('📱 App detail page initialized');
        console.log('🔗 URL Info:', this.urlInfo);
        
        this.applyTheme();
        this.loadAppDetail();
        
        // Bắt đầu auto refresh nếu có user đăng nhập
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.email) {
            this.startAutoRefresh(currentUser.email);
        }
    }
    
    // ==================== AUTO REFRESH FUNCTIONS ====================
    
    startAutoRefresh(userEmail) {
        if (!userEmail) return;
        
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.performAutoRefresh(userEmail);
        
        this.autoRefreshInterval = setInterval(() => {
            this.performAutoRefresh(userEmail);
        }, 5000);
        
        console.log('🔄 Auto refresh started for app detail page');
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('🛑 Auto refresh stopped for app detail page');
        }
    }
    
    async performAutoRefresh(userEmail) {
        try {
            const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=autoRefreshUser&email=${encodeURIComponent(userEmail)}`);
            const result = await response.json();
            
            if (result.success && result.autoRefreshed) {
                const userData = result.data;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                this.lastRefreshTime = new Date().toLocaleTimeString('vi-VN');
                console.log('✅ App detail page auto refreshed at:', this.lastRefreshTime);
            }
        } catch (error) {
            console.error('❌ Auto refresh error:', error);
        }
    }
    
    // ==================== URL PARSING FUNCTIONS ====================
    
    parseUrlId() {
        const urlParams = new URLSearchParams(window.location.search);
        const rawId = urlParams.get('id');
        
        console.log('🔗 Raw ID from URL:', rawId);
        
        if (!rawId) {
            return null;
        }
        
        if (/^\d+$/.test(rawId)) {
            console.log('📌 Định dạng cũ (chỉ số):', rawId);
            return {
                id: rawId,
                name: null,
                fullId: rawId
            };
        }
        
        const match = rawId.match(/^(\d+)-(.+)$/);
        if (match) {
            const id = match[1];
            const name = match[2].replace(/-/g, ' ');
            console.log('📌 Định dạng mới (số-tên):', { id, name });
            return {
                id: id,
                name: name,
                fullId: rawId
            };
        }
        
        console.log('❌ Định dạng không hợp lệ:', rawId);
        return {
            id: rawId,
            name: null,
            fullId: rawId
        };
    }
    
    createSeoUrl(appId, appName) {
        if (!appName) {
            return `app-detail.html?id=${appId}`;
        }
        
        const seoName = appName
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        return `app-detail.html?id=${appId}-${seoName}`;
    }
    
    updateBrowserUrl(appId, appName) {
        const newUrl = this.createSeoUrl(appId, appName);
        const currentUrl = window.location.href;
        
        if (!currentUrl.includes(newUrl)) {
            history.replaceState(null, '', newUrl);
            console.log('🔄 Đã cập nhật URL:', newUrl);
        }
    }
    
    // ==================== THEME MANAGEMENT ====================
    
    applyTheme() {
        const savedTheme = localStorage.getItem('theme');
        const htmlElement = document.documentElement;
        
        if (savedTheme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            htmlElement.setAttribute('data-theme', 'light');
            if (!savedTheme) {
                localStorage.setItem('theme', 'light');
            }
        }
    }
    
    // ==================== CUSTOM ALERT SYSTEM ====================
    
    showCustomAlert(type, title, message, buttons) {
        const alertIcon = document.getElementById('alertIcon');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertButtons = document.getElementById('alertButtons');
        
        alertIcon.className = 'alert-icon ' + type;
        const iconMap = {
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle',
            'info': 'fas fa-info-circle'
        };
        alertIcon.innerHTML = `<i class="${iconMap[type] || 'fas fa-info-circle'}"></i>`;
        
        alertTitle.textContent = title;
        alertMessage.innerHTML = message;
        
        alertButtons.innerHTML = '';
        
        if (buttons && buttons.length > 0) {
            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `alert-btn ${button.type || 'primary'}`;
                btn.textContent = button.text;
                if (button.icon) {
                    btn.innerHTML = `<i class="${button.icon}"></i> ${button.text}`;
                }
                if (button.onClick) {
                    btn.onclick = () => {
                        button.onClick();
                        this.alertOverlay.style.display = 'none';
                    };
                } else {
                    btn.onclick = () => {
                        this.alertOverlay.style.display = 'none';
                    };
                }
                alertButtons.appendChild(btn);
            });
        } else {
            const okBtn = document.createElement('button');
            okBtn.className = 'alert-btn primary';
            okBtn.innerHTML = '<i class="fas fa-check"></i> OK';
            okBtn.onclick = () => {
                this.alertOverlay.style.display = 'none';
            };
            alertButtons.appendChild(okBtn);
        }
        
        this.alertOverlay.style.display = 'flex';
    }
    
    // ==================== KIỂM TRA VIP - SỬ DỤNG AppUtils ====================
    
    getUserStatus() {
        const userData = this.getCurrentUser();
        return AppUtils.getUserStatus(userData);
    }
    
    canUserDownloadVIP(appVipPermissions) {
        const userData = this.getCurrentUser();
        return AppUtils.canUserDownloadVIP(userData, appVipPermissions);
    }
    
    getVipPermissionsReadable(appVipPermissions) {
        return AppUtils.getVipPermissionsReadable(appVipPermissions);
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    clearCache() {
        try {
            localStorage.removeItem('xspace_apps_cache');
            localStorage.removeItem('xspace_cache_timestamp');
            console.log('✅ Đã xoá cache');
        } catch (e) {
            console.log('⚠️ Không thể xoá cache:', e);
        }
    }
    
    showLoading() {
        this.appContent.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Đang tải thông tin ứng dụng...</p>
            </div>
        `;
    }
    
    showError(message, showRetry = true) {
        let retryButton = '';
        if (showRetry && this.retryCount < this.MAX_RETRIES) {
            retryButton = `
                <button class="retry-btn" onclick="appDetail.retryLoadApp()">
                    <i class="fas fa-redo"></i>
                    Thử lại
                </button>
            `;
        }
        
        this.appContent.innerHTML = `
            <div class="error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Đã xảy ra lỗi</h3>
                <p>${message}</p>
                ${retryButton}
                <button class="download-btn" onclick="window.location.href='index.html'" style="margin-top: 16px; max-width: 200px;">
                    <i class="fas fa-home"></i>
                    Quay về trang chủ
                </button>
            </div>
        `;
    }
    
    retryLoadApp() {
        this.retryCount++;
        console.log(`🔄 Thử lại lần ${this.retryCount}/${this.MAX_RETRIES}...`);
        this.loadAppDetail();
    }
    
    toggleDebug() {
        const toggle = document.querySelector('.debug-toggle');
        
        if (this.debugInfo.style.display === 'none' || this.debugInfo.style.display === '') {
            this.debugInfo.style.display = 'block';
            toggle.innerHTML = '<i class="fas fa-bug"></i> Ẩn thông tin debug';
            this.updateDebugInfo();
        } else {
            this.debugInfo.style.display = 'none';
            toggle.innerHTML = '<i class="fas fa-bug"></i> Hiển thị thông tin debug';
        }
    }
    
    updateDebugInfo() {
        if (!this.debugContent || !this.currentAppData) return;
        
        const userStatus = this.getUserStatus();
        
        this.debugContent.innerHTML = `
            <h4>Thông tin debug:</h4>
            <p><strong>App ID:</strong> ${this.appId}</p>
            <p><strong>Tên từ URL:</strong> ${this.appNameFromUrl || 'Không có'}</p>
            <p><strong>Retry count:</strong> ${this.retryCount}/${this.MAX_RETRIES}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>VIP Permissions:</strong> ${this.currentAppData.vipPermissions || 'all'}</p>
            <p><strong>Key Link:</strong> ${this.currentAppData.keylink ? 'Có' : 'Không'}</p>
            <p><strong>User Status:</strong> ${userStatus.status} (${userStatus.displayPackage})</p>
            <p><strong>Is Premium:</strong> ${userStatus.isPremium ? 'Có' : 'Không'}</p>
            <p><strong>Current URL:</strong> ${window.location.href}</p>
            <button class="retry-btn" onclick="appDetail.forceReload()" style="margin-top: 10px;">
                <i class="fas fa-sync-alt"></i>
                Tải lại dữ liệu
            </button>
        `;
    }
    
    forceReload() {
        this.clearCache();
        this.retryCount = 0;
        this.loadAppDetail();
    }
    
    // ==================== DATA PROCESSING ====================
    
    isValidImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        const trimmedUrl = url.trim();
        
        if (trimmedUrl === '' || 
            trimmedUrl === 'null' || 
            trimmedUrl === 'undefined' ||
            trimmedUrl === '#' ||
            trimmedUrl.toLowerCase() === 'null' ||
            trimmedUrl.toLowerCase() === 'undefined' ||
            trimmedUrl === 'N/A' ||
            trimmedUrl === 'n/a') {
            return false;
        }
        
        const isUrl = trimmedUrl.startsWith('http://') || 
                     trimmedUrl.startsWith('https://') || 
                     trimmedUrl.startsWith('//') ||
                     trimmedUrl.includes('.jpg') || 
                     trimmedUrl.includes('.jpeg') || 
                     trimmedUrl.includes('.png') ||
                     trimmedUrl.includes('.gif') ||
                     trimmedUrl.includes('.webp') ||
                     trimmedUrl.includes('imgur.com') ||
                     trimmedUrl.includes('i.imgur.com') ||
                     trimmedUrl.includes('cdn.discordapp.com') ||
                     trimmedUrl.includes('imageshack.com') ||
                     trimmedUrl.includes('photobucket.com');
        
        return isUrl;
    }
    
    processAppData(app) {
        console.log('🔍 Processing app data...');
        
        app.viplink1 = app.viplink1 || '';
        app.downloadlink = app.downloadlink || '';
        app.keylink = app.keylink || '';
        app.categories = app.categories || 'other';
        app.vipPermissions = app.vipPermissions || 'all';
        
        const possibleKeys = {
            'screenshot1': ['screenshot1', 'Screenshot1', 'screenshot_1', 'image1', 'Image1'],
            'screenshot2': ['screenshot2', 'Screenshot2', 'screenshot_2', 'image2', 'Image2'],
            'screenshot3': ['screenshot3', 'Screenshot3', 'screenshot_3', 'image3', 'Image3']
        };
        
        let foundScreenshot1 = '';
        for (const key of possibleKeys.screenshot1) {
            if (app[key] && typeof app[key] === 'string' && app[key].trim() !== '') {
                foundScreenshot1 = app[key].trim();
                break;
            }
        }
        
        let foundScreenshot2 = '';
        for (const key of possibleKeys.screenshot2) {
            if (app[key] && typeof app[key] === 'string' && app[key].trim() !== '') {
                foundScreenshot2 = app[key].trim();
                break;
            }
        }
        
        let foundScreenshot3 = '';
        for (const key of possibleKeys.screenshot3) {
            if (app[key] && typeof app[key] === 'string' && app[key].trim() !== '') {
                foundScreenshot3 = app[key].trim();
                break;
            }
        }
        
        if (!foundScreenshot1 && Array.isArray(app)) {
            if (app.length > 10) foundScreenshot1 = app[10] || '';
            if (app.length > 11) foundScreenshot2 = app[11] || '';
            if (app.length > 12) foundScreenshot3 = app[12] || '';
        }
        
        app.screenshot1 = foundScreenshot1;
        app.screenshot2 = foundScreenshot2;
        app.screenshot3 = foundScreenshot3;
        
        return app;
    }
    
    // ==================== DISPLAY FUNCTIONS ====================
    
    createDescriptionHTML(description) {
        return AppUtils.createFullDescriptionHTML(description);
    }
    
    createScreenshotsHTML(app) {
        console.log('🖼️ Creating screenshots HTML...');
        
        const screenshot1 = app.screenshot1 || '';
        const screenshot2 = app.screenshot2 || '';
        const screenshot3 = app.screenshot3 || '';
        
        const validImages = [];
        
        [screenshot1, screenshot2, screenshot3].forEach((url, index) => {
            if (this.isValidImageUrl(url)) {
                validImages.push({
                    src: url.trim(),
                    alt: `Ảnh minh hoạ ${index + 1} - ${app.name}`,
                    placeholder: `https://via.placeholder.com/220x400/2563eb/FFFFFF?text=Ảnh+${index + 1}`
                });
                console.log(`✅ Added screenshot ${index + 1}`);
            } else {
                console.log(`❌ Skipped invalid screenshot ${index + 1}:`, url);
            }
        });
        
        console.log(`📊 Total valid screenshots: ${validImages.length}`);
        
        if (validImages.length === 0) {
            return `
                <div class="no-screenshots-message">
                    <div class="no-screenshots-icon">
                        <i class="fas fa-images"></i>
                    </div>
                    <div class="no-screenshots-text">
                        <p>Ứng dụng này chưa có ảnh minh hoạ</p>
                        <p style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                            Ảnh minh hoạ sẽ được cập nhật trong thời gian sớm nhất
                        </p>
                    </div>
                </div>
            `;
        }
        
        let html = `
            <div class="screenshots-container">
                <div class="screenshots-wrapper" id="screenshotsWrapper">
        `;
        
        validImages.forEach((img, index) => {
            html += `
                <div class="screenshot-item">
                    <img src="${img.src}" 
                         alt="${img.alt}" 
                         class="screenshot" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${img.placeholder}';">
                </div>
            `;
        });
        
        html += `
                </div>
                
                ${validImages.length > 1 ? `
                    <div class="screenshot-nav prev" onclick="appDetail.scrollScreenshots(-220)">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="screenshot-nav next" onclick="appDetail.scrollScreenshots(220)">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                    <div class="screenshot-counter">
                        <span id="currentScreenshot">1</span> / ${validImages.length}
                    </div>
                ` : ''}
            </div>
        `;
        
        return html;
    }
    
    scrollScreenshots(amount) {
        const wrapper = document.getElementById('screenshotsWrapper');
        if (wrapper) {
            wrapper.scrollBy({ left: amount, behavior: 'smooth' });
        }
    }
    
    hasValidFreeDownload(downloadlink) {
        if (!downloadlink || typeof downloadlink !== 'string') {
            return false;
        }
        
        const trimmedLink = downloadlink.trim();
        
        if (trimmedLink === '' || 
            trimmedLink === 'null' || 
            trimmedLink === 'undefined' ||
            trimmedLink === '#' ||
            trimmedLink.toLowerCase() === 'null' ||
            trimmedLink.toLowerCase() === 'undefined' ||
            trimmedLink === 'N/A' ||
            trimmedLink === 'n/a') {
            return false;
        }
        
        const isUrl = trimmedLink.startsWith('http://') || 
                     trimmedLink.startsWith('https://') || 
                     trimmedLink.startsWith('//');
        
        return isUrl;
    }
    
    hasValidKeyLink(keylink) {
        if (!keylink || typeof keylink !== 'string') {
            return false;
        }
        
        const trimmedLink = keylink.trim();
        
        if (trimmedLink === '' || 
            trimmedLink === 'null' || 
            trimmedLink === 'undefined' ||
            trimmedLink === '#' ||
            trimmedLink.toLowerCase() === 'null' ||
            trimmedLink.toLowerCase() === 'undefined' ||
            trimmedLink === 'N/A' ||
            trimmedLink === 'n/a') {
            return false;
        }
        
        const isUrl = trimmedLink.startsWith('http://') || 
                     trimmedLink.startsWith('https://') || 
                     trimmedLink.startsWith('//');
        
        return isUrl;
    }
    
    displayAppDetail(app) {
        this.currentAppData = app;
        
        console.log('🎨 Displaying app detail:', app.name);
        console.log('👑 App VIP Permissions:', app.vipPermissions);
        console.log('🔑 App Key Link:', app.keylink);
        
        // Cập nhật URL trình duyệt với định dạng mới
        this.updateBrowserUrl(app.id, app.name);
        
        // Hiển thị nút chia sẻ
        this.shareBtnContainer.style.display = 'flex';
        
        const categoryLabels = {
            'game': 'Trò chơi',
            'social': 'Mạng xã hội',
            'entertainment': 'Giải trí',
            'photo': 'Ảnh & Video',
            'clone': 'Nhân bản',
            'premium': 'Mở khoá Premium',
            'education': 'Giáo dục',
            'health': 'Sức khỏe',
            'utility': 'Tiện ích'
        };
        
        let categories = [];
        if (typeof app.categories === 'string') {
            categories = app.categories.split(',');
        } else if (Array.isArray(app.categories)) {
            categories = app.categories;
        }
        
        const tagsHTML = categories.map(cat => 
            `<span class="app-tag">${categoryLabels[cat] || cat}</span>`
        ).join('');
        
        let formattedDate = 'Chưa cập nhật';
        if (app.updatedate) {
            try {
                const date = new Date(app.updatedate);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('vi-VN');
                }
            } catch (e) {
                formattedDate = app.updatedate;
            }
        }
        
        document.title = `${app.name} - XSpace Store`;
        
        const user = this.getCurrentUser();
        const userStatus = this.getUserStatus();
        
        this.loginPrompt.style.display = user ? 'none' : 'block';
        
        const hasFreeDownload = this.hasValidFreeDownload(app.downloadlink);
        const hasVipDownload = this.isValidImageUrl(app.viplink1?.replace('image', 'http') || '');
        const hasKeyLink = this.hasValidKeyLink(app.keylink);
        const isVipOnly = hasVipDownload && !hasFreeDownload;
        
        let downloadButtonsHTML = '';
        let downloadInfoText = '';
        let keySectionHTML = '';
        
        // Tạo icon HTML với VIP badge nếu cần
        let iconHTML = '';
        if (isVipOnly) {
            iconHTML = `
                <div class="app-icon-container">
                    <img src="${app.image || 'https://via.placeholder.com/135/2563eb/FFFFFF?text=App'}" 
                         alt="${app.name}" 
                         class="app-icon-large"
                         onerror="this.src='https://via.placeholder.com/135/2563eb/FFFFFF?text=App'">
                    <div class="app-badge-overlay">
                        <div class="vip-badge"></div>
                    </div>
                </div>
            `;
        } else {
            iconHTML = `
                <div class="app-icon-container">
                    <img src="${app.image || 'https://via.placeholder.com/135/2563eb/FFFFFF?text=App'}" 
                         alt="${app.name}" 
                         class="app-icon-large"
                         onerror="this.src='https://via.placeholder.com/135/2563eb/FFFFFF?text=App'">
                </div>
            `;
        }
        
        // Tạo các nút tải
        let downloadButtons = [];
        if (hasFreeDownload) {
            downloadButtons.push(this.createDownloadButton(app, false, user, userStatus));
        }
        if (hasVipDownload) {
            downloadButtons.push(this.createDownloadButton(app, true, user, userStatus));
        }
        
        // Xác định class cho download-options
        const downloadOptionsClass = downloadButtons.length === 2 ? 'download-options two-buttons' : 
                                    downloadButtons.length === 1 ? 'download-options one-button' : 
                                    'download-options';
        
        downloadButtonsHTML = downloadButtons.join('');
        
        downloadInfoText = app.viplink1 ? 'Premium: No Ads – Full Features – Unlimited Access' : 'Bản VIP đang được cập nhật';
        
        // Tạo section riêng cho Key nếu có
        if (hasKeyLink) {
            keySectionHTML = this.createKeySection(app, user, userStatus);
        }
        
        let vipCrownIcon = '';
        if (isVipOnly) {
            vipCrownIcon = '<i class="fas fa-crown vip-crown-icon"></i>';
        }
        
        const html = `
            <div class="app-header">
                ${iconHTML}
                <div class="app-info">
                    <h1 class="app-title">
                        ${app.name}
                        ${vipCrownIcon}
                    </h1>
                    <div class="app-developer">${app.developer || 'Nhà phát triển'}</div>
                    <div class="app-meta">
                        <div class="meta-item">
                            <span class="meta-label">Phiên bản</span>
                            <span class="meta-value">${app.version || '1.0.0'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Cập nhật</span>
                            <span class="meta-value">${formattedDate}</span>
                        </div>
                    </div>
                    <div class="app-tags">${tagsHTML}</div>
                </div>
            </div>

            ${downloadButtons.length > 0 ? `
            <div class="download-section">
                <h2 class="download-title">
                    <i class="fas fa-download"></i>
                    Tải ứng dụng
                </h2>
                <div class="${downloadOptionsClass}">
                    ${downloadButtonsHTML}
                </div>
                <div class="download-info">
                    <i class="fas fa-info-circle"></i>
                    ${downloadInfoText}
                </div>
            </div>
            ` : ''}

            ${keySectionHTML}

            <div class="description-section">
                <h2 class="section-title">Mô tả ứng dụng</h2>
                ${this.createDescriptionHTML(app.description)}
            </div>

            <div class="screenshots-section">
                <h2 class="section-title">Hình ảnh ứng dụng</h2>
                ${this.createScreenshotsHTML(app)}
            </div>

            <div class="support-section" style="text-align: center; margin-top: 30px; padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                <h3 style="margin-bottom: 10px; color: var(--text-primary); font-size: 15px;">Cần hỗ trợ?</h3>
                <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 12px;">Liên hệ với chúng tôi nếu bạn gặp vấn đề khi tải hoặc sử dụng ứng dụng</p>
                <button class="download-btn download-btn-secondary" onclick="appDetail.contactSupport()" style="max-width: 180px; font-size: 12px; padding: 8px 16px;">
                    <i class="fas fa-headset"></i>
                    Liên hệ hỗ trợ
                </button>
            </div>
        `;
        
        this.appContent.innerHTML = html;
        
        setTimeout(() => this.initScreenshotScroll(), 100);
    }
    
    /**
     * TẠO SECTION RIÊNG CHO MÃ ĐĂNG NHẬP
     */
    createKeySection(app, user, userStatus) {
        const link = app.keylink;
        
        if (!link || !this.hasValidKeyLink(link)) {
            return '';
        }
        
        // Nếu chưa đăng nhập
        if (!user) {
            return `
                <div class="key-section">
                    <h2 class="key-title">
                        <i class="fas fa-key"></i>
                        Mã đăng nhập
                    </h2>
                    <button class="key-btn" onclick="appDetail.requireLoginForKey()">
                        <i class="fas fa-key"></i>
                        Key đăng nhập
                    </button>
                    <div class="key-info">
                        <i class="fas fa-info-circle"></i>
                        Đăng nhập để lấy mã miễn phí
                    </div>
                </div>
            `;
        }
        
        // Đã đăng nhập - cho phép lấy key
        return `
            <div class="key-section">
                <h2 class="key-title">
                    <i class="fas fa-key"></i>
                    Mã đăng nhập
                </h2>
                <button class="key-btn" onclick="appDetail.getKey('${link}', '${app.name}')">
                    <i class="fas fa-key"></i>
                    Key đăng nhập
                </button>
                <div class="key-info">
                    <i class="fas fa-info-circle"></i>
                    Nhấn để lấy mã - Hoàn toàn miễn phí
                </div>
            </div>
        `;
    }
    
    /**
     * TẠO NÚT TẢI
     */
    createDownloadButton(app, isVIP, user, userStatus) {
        const link = isVIP ? app.viplink1 : app.downloadlink;
        const isValidLink = link && this.isValidImageUrl(link.replace('image', 'http'));
        
        if (isVIP) {
            // Trường hợp 1: Link VIP không hợp lệ
            if (!isValidLink) {
                return `
                    <button class="download-btn download-btn-premium" disabled style="background: var(--text-muted);">
                        <i class="fas fa-crown"></i>
                        Tải VIP #1 (Đang cập nhật)
                    </button>
                `;
            }
            
            // Trường hợp 2: Chưa đăng nhập
            if (!user) {
                return `
                    <button class="download-btn download-btn-premium" onclick="appDetail.requireLogin(true)">
                        <i class="fas fa-crown"></i>
                        Tải VIP #1
                    </button>
                `;
            }
            
            // Kiểm tra user có được phép tải không
            const canDownload = this.canUserDownloadVIP(app.vipPermissions);
            
            console.log('📊 Kiểm tra quyền tải VIP:', {
                canDownload: canDownload,
                vipPermissions: app.vipPermissions,
                userStatus: userStatus.status
            });
            
            // Trường hợp 3: User không có quyền
            if (!canDownload) {
                const requiredPackages = this.getVipPermissionsReadable(app.vipPermissions);
                return `
                    <button class="download-btn download-btn-premium" onclick="appDetail.showUpgradeRequiredAlert('${requiredPackages.join(', ')}')">
                        <i class="fas fa-crown"></i>
                        Tải VIP #1
                    </button>
                `;
            }
            
            // Trường hợp 4: Hợp lệ
            return `
                <button class="download-btn download-btn-premium" onclick="appDetail.downloadApp('${link}', '${app.name}', true)">
                    <i class="fas fa-crown"></i>
                    Tải VIP #1
                </button>
            `;
        } else {
            // Nút tải miễn phí
            if (!isValidLink) {
                return '';
            }
            
            if (!user) {
                return `
                    <button class="download-btn" onclick="appDetail.requireLogin(false)">
                        <i class="fas fa-download"></i>
                        Tải miễn phí
                    </button>
                `;
            }
            
            return `
                <button class="download-btn" onclick="appDetail.downloadApp('${link}', '${app.name}', false)">
                    <i class="fas fa-download"></i>
                    Tải miễn phí
                </button>
            `;
        }
    }
    
    initScreenshotScroll() {
        const wrapper = document.getElementById('screenshotsWrapper');
        const prevBtn = document.querySelector('.screenshot-nav.prev');
        const nextBtn = document.querySelector('.screenshot-nav.next');
        const counter = document.querySelector('#currentScreenshot');
        
        if (!wrapper) return;
        
        const totalItems = wrapper.querySelectorAll('.screenshot-item').length;
        if (totalItems > 1) {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        }
        
        wrapper.addEventListener('scroll', function() {
            const scrollLeft = wrapper.scrollLeft;
            const itemWidth = 220;
            const currentIndex = Math.round(scrollLeft / itemWidth) + 1;
            
            if (counter) {
                counter.textContent = Math.min(currentIndex, totalItems);
            }
            
            if (prevBtn) {
                prevBtn.style.display = scrollLeft > 0 ? 'flex' : 'none';
            }
            if (nextBtn) {
                nextBtn.style.display = scrollLeft < (wrapper.scrollWidth - wrapper.clientWidth - 10) ? 'flex' : 'none';
            }
        });
        
        wrapper.dispatchEvent(new Event('scroll'));
    }
    
    // ==================== LOAD APP DETAIL ====================
    
    async loadAppDetail() {
        if (!this.appId) {
            this.showError('Không tìm thấy ID ứng dụng', false);
            return;
        }
        
        console.log(`🚀 Loading app detail for ID: ${this.appId}`);
        console.log(`📌 Tên từ URL: ${this.appNameFromUrl || 'Không có'}`);
        
        this.clearCache();
        this.showLoading();
        
        try {
            const timestamp = Date.now();
            const url = `${this.GOOGLE_SCRIPT_URL}?action=getApps&t=${timestamp}&nocache=true`;
            
            console.log(`📡 Fetching from: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 Server response:', result);
            
            if (result.success && result.data) {
                const app = result.data.find(a => {
                    return a.id == this.appId || a.id === this.appId || a.id.toString() === this.appId.toString();
                });
                
                if (app) {
                    console.log('✅ Found app:', app.name);
                    const processedApp = this.processAppData(app);
                    this.displayAppDetail(processedApp);
                    this.retryCount = 0;
                } else {
                    console.error('❌ App not found with ID:', this.appId);
                    this.showError(`Không tìm thấy ứng dụng với ID: ${this.appId}`, true);
                }
            } else {
                throw new Error(result.message || 'Dữ liệu không hợp lệ từ server');
            }
        } catch (error) {
            console.error('💥 Error loading app:', error);
            
            if (this.retryCount < this.MAX_RETRIES) {
                this.showError(`Lỗi tải dữ liệu: ${error.message}. Thử lại?`, true);
            } else {
                this.showError(`Không thể tải thông tin ứng dụng sau ${this.MAX_RETRIES} lần thử. Vui lòng thử lại sau.`, false);
            }
        }
    }
    
    // ==================== SHARE FUNCTION ====================
    
    shareApp() {
        if (!this.currentAppData) return;
        
        const shareUrl = this.createSeoUrl(this.currentAppData.id, this.currentAppData.name);
        const fullUrl = window.location.origin + '/' + shareUrl;
        const shareText = `Xem ứng dụng ${this.currentAppData.name} trên XSpace Store`;
        
        if (navigator.share) {
            navigator.share({
                title: this.currentAppData.name,
                text: shareText,
                url: fullUrl
            })
            .then(() => console.log('✅ Chia sẻ thành công'))
            .catch((error) => {
                console.log('❌ Lỗi chia sẻ:', error);
                this.copyToClipboard(fullUrl);
            });
        } else {
            this.copyToClipboard(fullUrl);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                this.showCustomAlert('success', 'Đã sao chép!', 
                    'Đường dẫn đã được sao chép vào clipboard. Bạn có thể chia sẻ với bạn bè.', 
                    [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
            })
            .catch(err => {
                console.error('❌ Lỗi sao chép:', err);
                this.showCustomAlert('error', 'Lỗi', 
                    'Không thể sao chép đường dẫn. Vui lòng thử lại.', 
                    [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
            });
    }
    
    // ==================== USER FUNCTIONS ====================
    
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    }
    
    // ==================== DOWNLOAD FUNCTIONS ====================
    
    downloadApp(url, appName, isVIP = false) {
        if (!url || url === '#' || url === '' || url === 'null' || url === 'undefined') {
            this.showCustomAlert('warning', 'Thông báo', 
                '⚠️ Link tải đang được cập nhật. Vui lòng thử lại sau.', 
                [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
            return;
        }
        
        const type = isVIP ? 'VIP' : 'miễn phí';
        this.showCustomAlert('info', 'Xác nhận tải', 
            `Bạn muốn tải xuống ứng dụng <strong>${appName}</strong> (${type})?<br><br>Chọn "Tải xuống" để tiếp tục.`, 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Tải xuống', 
                    type: 'primary', 
                    icon: 'fas fa-download',
                    onClick: () => {
                        window.open(url, '_blank');
                        setTimeout(() => {
                            this.showCustomAlert('success', 'Thành công!', 
                                `✅ Đã bắt đầu tải xuống ${type}!`, 
                                [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
                        }, 500);
                    }
                }
            ]);
    }
    
    getKey(url, appName) {
        if (!url || url === '#' || url === '' || url === 'null' || url === 'undefined') {
            this.showCustomAlert('warning', 'Thông báo', 
                '⚠️ Link lấy mã đang được cập nhật. Vui lòng thử lại sau.', 
                [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
            return;
        }
        
        this.showCustomAlert('info', 'Xác nhận lấy mã', 
            `Bạn muốn lấy mã đăng nhập cho ứng dụng <strong>${appName}</strong>?<br><br>Chọn "Lấy mã" để tiếp tục.`, 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Lấy mã', 
                    type: 'primary', 
                    icon: 'fas fa-key',
                    onClick: () => {
                        window.open(url, '_blank');
                        setTimeout(() => {
                            this.showCustomAlert('success', 'Thành công!', 
                                `✅ Bạn sẽ được chuyển đến trang lấy mã đăng nhập!`, 
                                [{ text: 'OK', type: 'primary', icon: 'fas fa-check' }]);
                        }, 500);
                    }
                }
            ]);
    }
    
    requireLogin(isVIP = false) {
        const type = isVIP ? 'VIP' : 'miễn phí';
        this.showCustomAlert('warning', 'Yêu cầu đăng nhập', 
            `Bạn cần đăng nhập để tải ứng dụng ${type}.<br><br>Chuyển đến trang đăng nhập?`, 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Đăng nhập', 
                    type: 'primary', 
                    icon: 'fas fa-sign-in-alt',
                    onClick: () => {
                        window.location.href = 'account.html';
                    }
                }
            ]);
    }
    
    requireLoginForKey() {
        this.showCustomAlert('warning', 'Yêu cầu đăng nhập', 
            `Bạn cần đăng nhập để lấy mã đăng nhập miễn phí.<br><br>Chuyển đến trang đăng nhập?`, 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Đăng nhập', 
                    type: 'primary', 
                    icon: 'fas fa-sign-in-alt',
                    onClick: () => {
                        window.location.href = 'account.html';
                    }
                }
            ]);
    }
    
    requirePremium() {
        this.showCustomAlert('warning', 'Yêu cầu nâng cấp', 
            'Tài khoản của bạn chưa được cấp phép VIP hoặc đã hết hạn.<br><br>Nâng cấp tài khoản Premium ngay?', 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Nâng cấp', 
                    type: 'warning', 
                    icon: 'fas fa-crown',
                    onClick: () => {
                        window.location.href = 'payment.html';
                    }
                }
            ]);
    }
    
    showUpgradeRequiredAlert(requiredPackages) {
        this.showCustomAlert('warning', 'Không đủ điều kiện', 
            `Tài khoản của bạn hiện không đủ điều kiện tải ứng dụng này (VIP đã hết hạn hoặc không đúng gói).<br><br>
            <strong>Yêu cầu gói:</strong> ${requiredPackages}<br><br>
            Vui lòng nâng cấp gói cao hơn để tiếp tục.`, 
            [
                { 
                    text: 'Hủy', 
                    type: 'secondary', 
                    icon: 'fas fa-times',
                    onClick: () => {}
                },
                { 
                    text: 'Nâng cấp ngay', 
                    type: 'warning', 
                    icon: 'fas fa-crown',
                    onClick: () => {
                        window.location.href = 'payment.html';
                    }
                }
            ]);
    }
    
    contactSupport() {
        window.open('https://t.me/m/inBUSKQ1N2E1', '_blank');
    }
}

// Khởi tạo AppDetailManager
document.addEventListener('DOMContentLoaded', function() {
    window.appDetail = new AppDetailManager();
});

// Clear cache khi trang load
window.addEventListener('load', function() {
    if (window.appDetail) {
        window.appDetail.clearCache();
    }
});