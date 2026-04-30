/**
 * disable-longpress.js
 * Vô hiệu hóa hoàn toàn hành vi nhấn giữ (long press) trên toàn bộ website
 * Ngăn chặn hiển thị menu ngữ cảnh, context menu, copy link, open link, share...
 * Dành cho WKWebView / UIWebView iOS
 * 
 * Cơ chế hoạt động:
 * 1. Ngăn chặn sự kiện 'contextmenu' (menu chuột phải)
 * 2. Ngăn chặn sự kiện 'selectstart' (chọn văn bản)
 * 3. Ngăn chặn sự kiện 'dragstart' (kéo thả)
 * 4. Ngăn chặn touch events kéo dài bằng setTimeout và clearTimeout
 * 5. Áp dụng CSS user-select: none cho các phần tử nhạy cảm
 */

(function() {
    'use strict';
    
    console.log('🔒 Disable Long Press initialized - version 1.0');
    
    // ==================== 1. NGĂN CHẶN CONTEXT MENU (CHUỘT PHẢI / GIỮ CHUỘT) ====================
    
    /**
     * Ngăn chặn sự kiện contextmenu trên toàn bộ document
     * Đây là sự kiện chính gây ra menu ngữ cảnh khi nhấn giữ
     */
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // Prevent contextmenu on all elements
    document.body.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // ==================== 2. NGĂN CHẶN CHỌN VĂN BẢN ====================
    
    /**
     * Ngăn chặn việc chọn văn bản (selectstart)
     * Việc chọn văn bản cũng kích hoạt menu ngữ cảnh
     */
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    /**
     * Ngăn chặn sự kiện selectionchange
     */
    document.addEventListener('selectionchange', function(e) {
        // Clear selection nếu có
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    });
    
    // ==================== 3. NGĂN CHẶN KÉO THẢ ====================
    
    /**
     * Ngăn chặn kéo thả hình ảnh và liên kết
     */
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);
    
    // ==================== 4. NGĂN CHẶN TOUCH EVENTS KÉO DÀI ====================
    
    /**
     * Sử dụng setTimeout để xác định xem có phải là nhấn giữ hay không
     * Nếu touch kéo dài quá 500ms thì ngăn chặn
     */
    let touchTimer = null;
    let longPressPrevented = false;
    const LONG_PRESS_THRESHOLD = 500; // milliseconds
    
    // Ngăn chặn touchstart mặc định
    document.addEventListener('touchstart', function(e) {
        // Reset timer
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        
        longPressPrevented = false;
        
        // Không ngăn chặn touchstart ngay lập tức để giữ scroll hoạt động
        // Chỉ bắt đầu timer để phát hiện nhấn giữ
        touchTimer = setTimeout(function() {
            longPressPrevented = true;
            
            // Nếu đây là nhấn giữ, ngăn chặn tất cả các hành vi mặc định
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent default on the target element
            if (e.target) {
                e.target.style.webkitTouchCallout = 'none';
            }
            
            // Giả lập sự kiện contextmenu để ngăn chặn
            const fakeEvent = new Event('contextmenu');
            fakeEvent.preventDefault = function() {};
            fakeEvent.stopPropagation = function() {};
            Object.defineProperty(fakeEvent, 'defaultPrevented', { value: true });
            
        }, LONG_PRESS_THRESHOLD);
        
    }, { passive: false });
    
    // Khi kết thúc touch, clear timer nếu không phải long press
    document.addEventListener('touchend', function(e) {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        
        if (longPressPrevented) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    
    // Khi touch di chuyển (scroll), clear timer
    document.addEventListener('touchmove', function(e) {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        longPressPrevented = false;
    }, { passive: false });
    
    // ==================== 5. CSS STYLES - VÔ HIỆU HÓA QUA CSS ====================
    
    /**
     * Thêm style vào head để vô hiệu hóa user-select và touch-callout
     * Đây là lớp bảo vệ cuối cùng
     */
    const style = document.createElement('style');
    style.textContent = `
        /* Vô hiệu hóa chọn văn bản trên toàn bộ trang */
        * {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            
            /* Ngăn chặn highlight khi chạm */
            -webkit-tap-highlight-color: transparent !important;
            
            /* Ngăn chặn kéo thả hình ảnh */
            -webkit-user-drag: none !important;
            user-drag: none !important;
        }
        
        /* Cho phép chọn text trong input và textarea (vẫn cần thiết cho form) */
        input, textarea, [contenteditable="true"] {
            -webkit-touch-callout: default !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
        
        /* Đặc biệt xử lý cho các nút và liên kết trong navbar */
        .nav-pill-item,
        .nav-pill-icon,
        .nav-pill-label,
        .floating-nav a,
        .icon-btn,
        .back-btn,
        .logo {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            cursor: pointer;
        }
        
        /* Ngăn chặn hiển thị menu context trên hình ảnh */
        img {
            -webkit-touch-callout: none !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
            pointer-events: auto;
        }
        
        /* Ngăn chặn highlight khi click */
        a, button {
            -webkit-tap-highlight-color: transparent;
        }
    `;
    document.head.appendChild(style);
    
    // ==================== 6. XỬ LÝ ĐẶC BIỆT CHO CÁC PHẦN TỬ NAVBAR ====================
    
    /**
     * Tìm tất cả các phần tử navbar và thêm event listener để ngăn long press
     */
    function protectNavbarElements() {
        const navElements = document.querySelectorAll('.nav-pill-item, .nav-pill-icon, .nav-pill-label, .floating-nav a');
        
        navElements.forEach(function(el) {
            // Ngăn contextmenu trên từng element
            el.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, false);
            
            // Ngăn selectstart
            el.addEventListener('selectstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, false);
            
            // Ngăn dragstart
            el.addEventListener('dragstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, false);
        });
    }
    
    // ==================== 7. XỬ LÝ ĐẶC BIỆT CHO HÌNH ẢNH ====================
    
    /**
     * Ngăn chặn long press trên hình ảnh
     */
    function protectImages() {
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, false);
            
            // Thêm attribute draggable="false"
            img.setAttribute('draggable', 'false');
        });
    }
    
    // ==================== 8. THEO DÕI DOM CHANGES ====================
    
    /**
     * Sử dụng MutationObserver để theo dõi các phần tử được thêm vào DOM
     * và áp dụng bảo vệ cho chúng
     */
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Kiểm tra các node được thêm vào
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Nếu là phần tử navbar
                    if (node.matches && (
                        node.matches('.nav-pill-item') ||
                        node.matches('.nav-pill-icon') ||
                        node.matches('.nav-pill-label') ||
                        node.matches('.floating-nav a') ||
                        node.querySelectorAll
                    )) {
                        // Bảo vệ element và các element con
                        protectElementAndChildren(node);
                    }
                    
                    // Nếu có hình ảnh bên trong
                    if (node.querySelectorAll) {
                        const images = node.querySelectorAll('img');
                        images.forEach(function(img) {
                            img.setAttribute('draggable', 'false');
                            img.addEventListener('contextmenu', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            });
                        });
                    }
                }
            });
        });
    });
    
    // Bảo vệ một element và tất cả children của nó
    function protectElementAndChildren(element) {
        if (!element || !element.addEventListener) return;
        
        element.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, false);
        
        element.addEventListener('selectstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, false);
        
        element.addEventListener('dragstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, false);
        
        // Bảo vệ children
        if (element.children) {
            Array.from(element.children).forEach(function(child) {
                protectElementAndChildren(child);
            });
        }
    }
    
    // Bắt đầu theo dõi DOM changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // ==================== 9. XỬ LÝ ĐẶC BIỆT CHO WEBVIEW iOS ====================
    
    /**
     * Thêm meta tag để ngăn chặn zoom (đã có trong code)
     * và ngăn chặn các hành vi khác đặc trưng của WebView
     */
    function addWebViewMetaTags() {
        // Kiểm tra xem đã có meta viewport chưa
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            let content = viewportMeta.getAttribute('content');
            if (!content.includes('user-scalable=no')) {
                viewportMeta.setAttribute('content', content + ', user-scalable=no');
            }
        }
    }
    
    addWebViewMetaTags();
    
    // ==================== 10. KHỞI TẠO KHI DOM READY ====================
    
    document.addEventListener('DOMContentLoaded', function() {
        protectNavbarElements();
        protectImages();
        
        console.log('✅ Disable Long Press - All protections applied');
        
        // Thêm class để CSS có thể target
        document.body.classList.add('longpress-disabled');
    });
    
    // Chạy lại khi các phần tử dynamic được load (ví dụ từ app.js)
    if (typeof window !== 'undefined') {
        // Lắng nghe sự kiện từ các script khác
        window.addEventListener('load', function() {
            setTimeout(function() {
                protectNavbarElements();
                protectImages();
            }, 500);
        });
    }
    
    // ==================== 11. EXPORT (nếu cần dùng module) ====================
    
    // Nếu cần, export để sử dụng trong các script khác
    window.DisableLongPress = {
        reinit: function() {
            protectNavbarElements();
            protectImages();
            console.log('🔄 Disable Long Press reinitialized');
        },
        isEnabled: true
    };
    
})();
