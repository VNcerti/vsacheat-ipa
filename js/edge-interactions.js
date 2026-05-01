// edge-interactions.js
// Disable long press and context menu on WKWebView for iOS

(function() {
    'use strict';
    
    /**
     * Vô hiệu hóa hoàn toàn menu ngữ cảnh (context menu)
     * Ngăn chặn long press trên toàn bộ trang web
     */
    
    // 1. Ngăn chặn sự kiện contextmenu (click chuột phải / nhấn giữ)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // 2. Ngăn chặn sự kiện selectstart (bắt đầu chọn văn bản)
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // 3. Ngăn chặn sự kiện drag (kéo thả)
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // 4. Ngăn chặn copy, cut, paste (sao chép, cắt, dán)
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    document.addEventListener('cut', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // 5. CSS style ngăn chặn user-select trên toàn bộ trang
    // Thêm style vào head để ngăn chọn văn bản
    const style = document.createElement('style');
    style.textContent = `
        /* Ngăn chọn văn bản trên toàn bộ trang */
        * {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Vẫn cho phép chọn trên input và textarea (cần thiết cho form) */
        input, textarea, [contenteditable="true"] {
            -webkit-touch-callout: default !important;
            -webkit-user-select: text !important;
            user-select: text !important;
        }
        
        /* Đảm bảo các nút và link không hiển thị menu ngữ cảnh */
        a, button, .nav-pill-item, .icon-btn, .download-btn, .upgrade-btn, .action-btn {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            touch-action: manipulation !important;
        }
        
        /* Ngăn chặn highlight khi nhấn giữ trên iOS */
        .nav-pill-item, 
        .nav-pill-icon, 
        .nav-pill-label,
        .icon-btn,
        .download-btn,
        .app-card,
        .featured-card,
        .category-card,
        .package-card,
        .info-card,
        .auth-card,
        .btn,
        button {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
            touch-action: manipulation !important;
        }
    `;
    document.head.appendChild(style);
    
    // 6. Xử lý riêng cho các thẻ <a> (link) để ngăn menu ngữ cảnh
    const handleLinkLongPress = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
    
    // Áp dụng cho tất cả link hiện tại và tương lai
    const disableLinks = function() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('contextmenu', handleLinkLongPress);
            link.addEventListener('touchstart', function(e) {
                // Cho phép tap bình thường, chỉ chặn khi nhấn giữ
                let timer;
                const handleTouchStart = () => {
                    timer = setTimeout(() => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, 500);
                };
                const handleTouchEnd = () => {
                    clearTimeout(timer);
                };
                link.addEventListener('touchstart', handleTouchStart);
                link.addEventListener('touchend', handleTouchEnd);
                link.addEventListener('touchcancel', handleTouchEnd);
            });
        });
    };
    
    // Chạy khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            disableLinks();
            // Quan sát DOM thay đổi để xử lý các link mới được thêm vào
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        const newLinks = document.querySelectorAll('a:not([data-longpress-disabled])');
                        newLinks.forEach(link => {
                            link.setAttribute('data-longpress-disabled', 'true');
                            link.addEventListener('contextmenu', handleLinkLongPress);
                        });
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        disableLinks();
    }
    
    // 7. Xử lý đặc biệt cho FLOATING NAVIGATION PILL
    const disableNavItemsLongPress = function() {
        const navItems = document.querySelectorAll('.nav-pill-item');
        navItems.forEach(item => {
            item.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            // Chặn long press trên iOS
            let pressTimer;
            item.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(() => {
                    e.preventDefault();
                    e.stopPropagation();
                }, 500);
            });
            item.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            });
            item.addEventListener('touchcancel', function() {
                clearTimeout(pressTimer);
            });
            
            // Chặn copy link khi nhấn giữ
            item.style.webkitTouchCallout = 'none';
        });
    };
    
    // 8. Xử lý cho toàn bộ các phần tử có thể bị long press
    const disableAllElementsLongPress = function() {
        const elements = document.querySelectorAll(
            '.app-card, .featured-card, .category-card, .package-card, ' +
            '.info-card, .auth-card, .btn, button, .icon-btn, .download-btn, ' +
            '.upgrade-btn, .action-btn, .logo, .hero-content, .app-detail, ' +
            '.app-header, .app-info, .app-name, .app-description-check'
        );
        
        elements.forEach(el => {
            el.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            el.style.webkitTouchCallout = 'none';
        });
    };
    
    // Khởi tạo tất cả các hàm vô hiệu hóa
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            disableNavItemsLongPress();
            disableAllElementsLongPress();
            
            // Quan sát DOM để xử lý các phần tử mới được thêm vào
            const observer = new MutationObserver(function() {
                disableNavItemsLongPress();
                disableAllElementsLongPress();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        disableNavItemsLongPress();
        disableAllElementsLongPress();
    }
    
    // 9. Xử lý sự kiện touchmove để ngăn chặn kéo thả nội dung
    document.addEventListener('touchmove', function(e) {
        // Cho phép scroll bình thường, chỉ chặn khi đang kéo thả nội dung được chọn
        const target = e.target;
        if (target && (
            target.tagName === 'IMG' || 
            target.classList?.contains('app-logo') ||
            target.classList?.contains('featured-background')
        )) {
            // Chỉ chặn khi kéo ảnh
            e.preventDefault();
        }
    }, { passive: false });
    
    // 10. Ngăn chặn hiển thị menu khi nhấn giữ trên iOS đặc biệt cho WKWebView
    if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers) {
        // Đang chạy trong WKWebView, có thể thêm xử lý đặc biệt nếu cần
        console.log('Running in WKWebView - Long press disabled');
    }
    
    console.log('edge-interactions.js loaded - Long press and context menu disabled');
})();
