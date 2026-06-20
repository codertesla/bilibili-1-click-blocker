// ==UserScript==
// @name         B站一键拉黑UP主
// @description  在B站首页、视频页和搜索页添加拉黑按钮，一键拉黑UP主。支持首页隐藏直播卡片、屏蔽广告卡片。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @version      1.3.9
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @namespace    https://github.com/codertesla/bilibili-1-click-blocker
// @author       codertesla
// @supportURL   https://github.com/codertesla/bilibili-1-click-blocker
// @homepageURL  https://github.com/codertesla/bilibili-1-click-blocker
// @license      MIT
// @updateURL    https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// @downloadURL  https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 常量 ====================
    const VERSION = '1.3.9';

    const API = {
        MODIFY: 'https://api.bilibili.com/x/relation/modify',
        RELATION: 'https://api.bilibili.com/x/relation',
        // ps=1：我们只用 total 字段，无需拉完整列表
        BLACKS: 'https://api.bilibili.com/x/relation/blacks?re_version=0&pn=1&ps=1&jsonp=jsonp&web_location=333.33',
        MANAGE: 'https://account.bilibili.com/account/blacklist',
    };

    // B 站关系接口常用错误码
    const ERR_CODE = {
        OK: 0,
        NOT_LOGIN: -101,
        CSRF: -111,
        RISK: -352,
        ALREADY_BLOCKED: 22120,
    };

    const ERR_MSG = {
        [ERR_CODE.NOT_LOGIN]: '未登录或登录已过期',
        [ERR_CODE.CSRF]: 'CSRF 校验失败，请刷新页面重试',
        [ERR_CODE.RISK]: '触发 B 站风控，请稍后再试',
    };

    const STORAGE_KEYS = {
        HIDE_LIVE: 'hideLiveCards',
        BLOCK_AD: 'blockAdCards',
        VIDEO_PROFILE_BUTTON: 'videoProfileButton',
    };

    // 首页可能的视频卡片容器
    const HOME_CARD_SELECTORS = [
        '.bili-video-card',
        '.video-card',
        '.bili-video-card__wrap',
        '.feed-card',
    ];

    // B 站不同版本播放器的网页全屏 / 全屏状态标记
    const VIDEO_PLAYER_EXPANDED_SELECTOR = [
        '.player-full-win',
        '.player-fullscreen',
        '.bpx-state-webfull',
        '.bpx-state-webscreen',
        '.bpx-state-fullscreen',
        '.bpx-player-container[data-screen="web"]',
        '.bpx-player-container[data-screen="webscreen"]',
        '.bpx-player-container[data-screen="full"]',
        '.squirtle-video-pagefullscreen',
        '.squirtle-video-fullscreen',
        '.player-mode-webfullscreen',
        '.mode-webscreen',
    ].join(',');

    const VIDEO_PLAYER_ROOT_SELECTOR = [
        '#bilibili-player',
        '#bilibili-player-wrap',
        '.bpx-player-container',
        '.bilibili-player',
        '.bilibili-player-video-wrap',
    ].join(',');

    // ==================== 样式 ====================
    const STYLES = `
        /* 通用按钮样式 - 亮色主题默认 */
        .bilibili-blacklist-btn {
          color: #9499a0 !important;
          cursor: pointer !important;
          font-weight: normal !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1px 5px !important;
          border: 1px solid #c9ccd0 !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          transition: all 0.2s ease !important;
          background-color: transparent !important;
          box-shadow: none !important;
          width: auto !important;
          min-width: unset !important;
          max-width: none !important;
          box-sizing: border-box !important;
          text-align: center !important;
          white-space: nowrap !important;
          gap: 1px !important;
          vertical-align: middle;
          line-height: normal;
          margin: 0 5px 0 0 !important;
          font-family: inherit !important;
        }
        .bilibili-blacklist-btn:hover {
          background-color: rgba(226, 93, 93, 0.1) !important;
          color: #e25d5d !important;
          border-color: #e25d5d !important;
          box-shadow: none !important;
        }
        .bilibili-blacklist-btn:active {
          transform: scale(0.95) !important;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .bilibili-blacklist-btn { animation: fadeIn 0.3s ease-out !important; }

        /* 已拉黑 / 禁用态 - 亮色 */
        .bilibili-blacklist-btn:disabled,
        .bilibili-blacklist-btn[disabled] {
          color: #b8bcc0 !important;
          background-color: rgba(0, 0, 0, 0.02) !important;
          border-color: #d9dce0 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
        }

        /* 暗色主题 (B 站 html.night-mode) */
        html.night-mode .bilibili-blacklist-btn {
          color: rgba(255, 255, 255, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          background-color: transparent !important;
        }
        html.night-mode .bilibili-blacklist-btn:hover {
          color: #ff6b6b !important;
          border-color: #ff6b6b !important;
          background-color: rgba(255, 107, 107, 0.12) !important;
        }
        html.night-mode .bilibili-blacklist-btn:disabled,
        html.night-mode .bilibili-blacklist-btn[disabled] {
          color: rgba(255, 255, 255, 0.25) !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* 隔离浮层按钮 */
        .video-upinfo-blacklist-overlay {
          position: fixed !important;
          z-index: 1000 !important;
          pointer-events: none !important;
        }
        .video-card-blacklist-overlay {
          position: fixed !important;
          z-index: 1000 !important;
          pointer-events: none !important;
        }
        .home-card-blacklist-overlay {
          position: fixed !important;
          z-index: 1000 !important;
          pointer-events: none !important;
        }
        .video-upinfo-blacklist-overlay > .bilibili-blacklist-btn,
        .video-card-blacklist-overlay > .bilibili-blacklist-btn,
        .home-card-blacklist-overlay > .bilibili-blacklist-btn {
          pointer-events: auto !important;
          margin: 0 !important;
          font-size: 11px !important;
          padding: 1px 5px !important;
          line-height: normal !important;
        }

        /* Toast */
        .bili-blacklist-toast {
          position: fixed !important;
          z-index: 99999 !important;
          top: 30px !important;
          left: 50% !important;
          transform: translateX(-50%) translateY(0) !important;
          background-color: rgba(0, 0, 0, 0.8) !important;
          color: white !important;
          padding: 10px 20px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          transition: opacity 0.3s ease, transform 0.3s ease !important;
          opacity: 1 !important;
          animation: toastIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) !important; }
          to { opacity: 1; transform: translateX(-50%) translateY(0) !important; }
        }
        .bili-blacklist-toast-icon { font-size: 18px !important; line-height: 1 !important; }
        .bili-blacklist-toast-content { line-height: 1.5 !important; }

        /* 隐藏直播卡片 */
        body.hide-live-cards .floor-single-card:has(.floor-title) {
          display: none !important;
        }
    `;

    // ==================== 调试日志 ====================
    let DEBUG = false;
    try {
        DEBUG = window.localStorage && localStorage.getItem('BILIBILI_BLACKLIST_DEBUG') === 'true';
    } catch (_) { DEBUG = false; }
    if (!DEBUG && window.BILIBILI_BLACKLIST_DEBUG === true) DEBUG = true;

    const log = (...args) => { if (DEBUG) console.log('[拉黑脚本]', ...args); };

    // ==================== 工具函数 ====================
    function debounce(fn, wait) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function getCookie(name) {
        const re = new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\\/+^]/g, '\\$&') + '=([^;]*)');
        const m = document.cookie.match(re);
        return m ? decodeURIComponent(m[1]) : '';
    }

    /**
     * 从 UP 主主页 URL 中提取 UID，兼容多种格式：
     *   //space.bilibili.com/123
     *   https://space.bilibili.com/123?xxx
     *   /space/123/
     *   /123
     */
    function extractUid(url) {
        if (!url) return '';
        const patterns = [
            /space\.bilibili\.com\/(\d+)/,
            /\/space\/(\d+)/,
            /\/(\d+)(?:[\/?#]|$)/,
        ];
        for (const re of patterns) {
            const m = url.match(re);
            if (m && /^\d+$/.test(m[1])) return m[1];
        }
        return '';
    }

    function fadeOutAndRemove(el, duration = 300) {
        if (!el || !el.parentNode) return;
        el.style.transition = `opacity ${duration}ms ease`;
        // 触发 reflow 让 transition 生效
        void el.getBoundingClientRect();
        el.style.opacity = '0';
        setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
    }

    // ==================== Shadow DOM 支持 ====================
    // B 站部分区域使用 Shadow DOM（如某些第三方皮肤/插件），需要把样式注入进去并跨域查询
    const shadowRootRegistry = new Set();
    const injectedShadowHosts = new WeakSet();
    const shadowScanQueue = new Set();
    let shadowScanScheduled = false;

    function scheduleShadowScan(node) {
        if (!node) return;
        if (node === document) node = document.documentElement;
        if (!node || (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)) return;

        shadowScanQueue.add(node);
        if (shadowScanScheduled) return;
        shadowScanScheduled = true;

        const runner = () => {
            shadowScanScheduled = false;
            const batch = Array.from(shadowScanQueue);
            shadowScanQueue.clear();
            batch.forEach(scanShadowHosts);
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(runner, { timeout: 300 });
        } else {
            window.requestAnimationFrame(runner);
        }
    }

    function flushShadowScan() {
        if (shadowScanQueue.size === 0) return;
        const batch = Array.from(shadowScanQueue);
        shadowScanQueue.clear();
        batch.forEach(scanShadowHosts);
    }

    function scanShadowHosts(root) {
        if (!root) return;
        const stack = [];
        if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            for (const c of root.childNodes) {
                if (c.nodeType === Node.ELEMENT_NODE) stack.push(c);
            }
        } else if (root.nodeType === Node.ELEMENT_NODE) {
            stack.push(root);
        }

        while (stack.length) {
            const cur = stack.pop();
            if (cur.shadowRoot) injectStyleInto(cur);
            const children = cur.children;
            for (let i = 0; i < children.length; i++) stack.push(children[i]);
        }
    }

    function injectStyleInto(host) {
        if (!host || !host.shadowRoot) return;
        shadowRootRegistry.add(host.shadowRoot);
        if (injectedShadowHosts.has(host)) return;
        if (!host.shadowRoot.querySelector('style[data-bilibili-blacklist-style]')) {
            const style = document.createElement('style');
            style.setAttribute('data-bilibili-blacklist-style', 'true');
            style.textContent = STYLES;
            host.shadowRoot.appendChild(style);
        }
        injectedShadowHosts.add(host);
    }

    // 定期清理已 detach 的 shadow root，避免 Set 无限增长
    function cleanupShadowRegistry() {
        for (const root of shadowRootRegistry) {
            if (!root || !root.host || !root.host.isConnected) {
                shadowRootRegistry.delete(root);
            }
        }
    }

    function queryAllDeep(selector) {
        const results = Array.from(document.querySelectorAll(selector));
        for (const root of shadowRootRegistry) {
            if (!root || !root.host || !root.host.isConnected) continue;
            try {
                const found = root.querySelectorAll(selector);
                if (found.length) results.push(...found);
            } catch (_) { /* 个别选择器在 shadow root 中可能报错，忽略即可 */ }
        }
        return results;
    }

    // ==================== Toast ====================
    function showToast(message, duration = 3000) {
        // 同一时刻只保留最新一条
        document.querySelectorAll('.bili-blacklist-toast').forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.className = 'bili-blacklist-toast';

        const icon = document.createElement('span');
        icon.className = 'bili-blacklist-toast-icon';
        icon.textContent = '✓';

        const content = document.createElement('div');
        content.className = 'bili-blacklist-toast-content';
        content.textContent = message; // textContent 避免 XSS

        toast.appendChild(icon);
        toast.appendChild(content);
        (document.body || document.documentElement).appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ==================== 拉黑按钮 ====================
    function createBlacklistButton(uid, upName) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bilibili-blacklist-btn';
        btn.dataset.uid = uid;
        btn.textContent = '拉黑';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.disabled) return;
            blockUser(uid, upName, btn);
        });
        return btn;
    }

    function markButtonsBlocked(uid) {
        relationStateCache.set(uid, true);
        queryAllDeep(`.bilibili-blacklist-btn[data-uid="${uid}"]`).forEach(btn => {
            if (btn.disabled && btn.textContent === '已拉黑') return;
            btn.textContent = '已拉黑';
            btn.disabled = true;
            delete btn.dataset.originalText;
        });
    }

    function setButtonLoading(btn) {
        if (!btn) return;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = '拉黑中…';
        btn.disabled = true;
    }

    function restoreButton(btn) {
        if (!btn || !btn.isConnected) return;
        const orig = btn.dataset.originalText;
        if (orig) btn.textContent = orig;
        delete btn.dataset.originalText;
        btn.disabled = false;
    }

    // ==================== 拉黑 API ====================
    function blockUser(uid, upName, triggerBtn) {
        log('拉黑', uid, upName);

        const csrf = getCookie('bili_jct');
        if (!csrf) {
            showToast('请先登录 B 站账号');
            return;
        }

        setButtonLoading(triggerBtn);
        const isVideoPage = location.pathname.startsWith('/video/');

        fetch(API.MODIFY, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                fid: uid,
                act: '5',
                re_src: '11',
                gaia_source: 'web_main',
                csrf,
            }),
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                log('拉黑响应:', data);
                if (data.code === ERR_CODE.OK) {
                    showToast(`已将 "${upName || 'UP主'}" 加入黑名单`);
                    markButtonsBlocked(uid);
                    if (!isVideoPage) removeCardsByUid(uid);
                } else if (data.code === ERR_CODE.ALREADY_BLOCKED) {
                    showToast('该用户已被拉黑');
                    markButtonsBlocked(uid);
                } else {
                    const msg = ERR_MSG[data.code] || data.message || `错误码 ${data.code}`;
                    showToast(`拉黑失败：${msg}`);
                    restoreButton(triggerBtn);
                }
            })
            .catch(err => {
                log('拉黑请求错误:', err);
                showToast('拉黑请求失败，请检查网络');
                restoreButton(triggerBtn);
            })
            .finally(() => {
                updateBlacklistCount();
            });
    }

    function removeCardsByUid(uid) {
        for (const [card, info] of homeCardRegistry) {
            if (info.uid === uid && card.isConnected) {
                fadeOutAndRemove(card);
            }
        }
        const cardSel = [
            `.bili-video-card[data-up-id="${uid}"]`,
            `.feed-card[data-up-id="${uid}"]`,
            `.video-card[data-up-id="${uid}"]`,
            `.group\\/desc[data-up-id="${uid}"]`,
            `div.uid_${uid}`,
        ].join(',');
        queryAllDeep(cardSel).forEach(el => fadeOutAndRemove(el));
    }

    function updateBlacklistCount() {
        fetch(API.BLACKS, { method: 'GET', credentials: 'include' })
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then(data => {
                if (data.code === ERR_CODE.OK && data.data) {
                    menuCtl.total = data.data.total;
                }
            })
            .catch(err => log('获取黑名单失败:', err));
    }

    // ==================== 菜单 ====================
    // 「去管理黑名单」菜单项：动态显示黑名单数
    const menuCtl = (() => {
        let total = 0;
        let menuId = null;
        const label = () => '去管理黑名单 --（ ' + (total < 1 ? '请留意黑名单数量 ）' : `总共：${total} ）`);
        const register = () => {
            try {
                menuId = GM_registerMenuCommand(label(), () => window.open(API.MANAGE, '_blank'));
            } catch (e) { log('注册菜单失败:', e); }
        };
        register();
        return {
            get total() { return total; },
            set total(v) {
                if (v === total) return;
                if (menuId !== null) {
                    try { GM_unregisterMenuCommand(menuId); } catch (_) { /* ignore */ }
                }
                total = v;
                register();
            },
        };
    })();

    const settings = {
        hideLiveCards: GM_getValue(STORAGE_KEYS.HIDE_LIVE, false),
        blockAdCards: GM_getValue(STORAGE_KEYS.BLOCK_AD, true),
        videoProfileButton: GM_getValue(STORAGE_KEYS.VIDEO_PROFILE_BUTTON, true),
    };

    function applyHideLiveClass() {
        document.body.classList.toggle('hide-live-cards', settings.hideLiveCards);
    }

    // 通用的「可切换」菜单项注册器
    function registerToggleMenu(getLabel, onToggle) {
        let id = null;
        const register = () => {
            try {
                id = GM_registerMenuCommand(getLabel(), () => {
                    onToggle();
                    if (id !== null) {
                        try { GM_unregisterMenuCommand(id); } catch (_) { /* ignore */ }
                    }
                    register();
                });
            } catch (e) { log('注册菜单失败:', e); }
        };
        register();
    }

    function registerToggleMenus() {
        registerToggleMenu(
            () => settings.hideLiveCards ? '✓ 首页隐藏直播卡片（已开启）' : '○ 首页隐藏直播卡片（已关闭）',
            () => {
                settings.hideLiveCards = !settings.hideLiveCards;
                GM_setValue(STORAGE_KEYS.HIDE_LIVE, settings.hideLiveCards);
                applyHideLiveClass();
                showToast(settings.hideLiveCards ? '已开启隐藏直播卡片' : '已关闭隐藏直播卡片');
            }
        );
        registerToggleMenu(
            () => settings.blockAdCards ? '✓ 屏蔽广告和运营推广（已开启）' : '○ 屏蔽广告和运营推广（已关闭）',
            () => {
                settings.blockAdCards = !settings.blockAdCards;
                GM_setValue(STORAGE_KEYS.BLOCK_AD, settings.blockAdCards);
                showToast(settings.blockAdCards ? '已开启广告屏蔽，刷新页面生效' : '已关闭广告屏蔽');
                if (settings.blockAdCards) removeAdCards();
            }
        );
        registerToggleMenu(
            () => settings.videoProfileButton ? '✓ 视频页 UP 主信息拉黑按钮（已开启）' : '○ 视频页 UP 主信息拉黑按钮（已关闭）',
            () => {
                settings.videoProfileButton = !settings.videoProfileButton;
                GM_setValue(STORAGE_KEYS.VIDEO_PROFILE_BUTTON, settings.videoProfileButton);
                if (settings.videoProfileButton) {
                    findAndProcessVideoUp();
                } else {
                    removeVideoProfileOverlay();
                }
                showToast(settings.videoProfileButton ? '已开启视频页 UP 主信息拉黑按钮' : '已关闭视频页 UP 主信息拉黑按钮');
            }
        );
    }

    // ==================== 广告移除 ====================
    function removeAdCards() {
        if (!settings.blockAdCards) return;

        // 1. 带「广告」文本标记的卡片
        queryAllDeep('.bili-video-card__stats--text, .bili-video-card__info--text-ad').forEach(el => {
            if (el.textContent.trim() !== '广告') return;
            const card = el.closest('.feed-card, .bili-video-card, .video-card, .floor-single-card');
            if (card) card.remove();
        });

        // 2. 视频播放页等特定位置的广告元素
        queryAllDeep('#slide_ad, .video-card-ad-small').forEach(el => el.remove());

        // 3. 视频页右侧运营推广卡片（非普通视频推荐）
        queryAllDeep('.video-page-special-card-small a[href*="specialRecommendByOp"]').forEach(link => {
            const card = link.closest('.video-page-special-card-small');
            if (card) card.remove();
        });
    }

    // ==================== 页面处理：首页 / 搜索页 ====================
    const homeCardOverlays = new Map();
    const homeCardRegistry = new Map();

    function removeHomeCardOverlays() {
        for (const { overlay } of homeCardOverlays.values()) {
            overlay.remove();
        }
        homeCardOverlays.clear();
        homeCardRegistry.clear();
    }

    function positionHomeCardOverlays() {
        for (const [anchor, entry] of homeCardOverlays) {
            const { overlay, card } = entry;
            if (!anchor.isConnected || !card.isConnected) {
                overlay.remove();
                homeCardOverlays.delete(anchor);
                homeCardRegistry.delete(card);
                continue;
            }

            const rect = getTextRect(anchor);
            if (!rect) continue;
            const outsideViewport = rect.bottom <= 0
                || rect.top >= window.innerHeight
                || rect.right <= 0
                || rect.left >= window.innerWidth;
            if (rect.width === 0 || rect.height === 0 || outsideViewport) {
                overlay.style.display = 'none';
                continue;
            }

            overlay.style.display = 'block';
            const overlayWidth = overlay.offsetWidth;
            const overlayHeight = overlay.offsetHeight;
            const cardRect = card.getBoundingClientRect();
            const preferredLeft = rect.right + 6;
            const maxLeft = Math.min(cardRect.right - overlayWidth, window.innerWidth - overlayWidth);
            overlay.style.left = `${Math.max(cardRect.left, Math.min(preferredLeft, maxLeft))}px`;
            overlay.style.top = `${Math.max(0, rect.top + (rect.height - overlayHeight) / 2)}px`;
        }
    }

    function mountHomeCardOverlay(card, anchor, uid, upName) {
        if (homeCardOverlays.has(anchor)) return false;

        const overlay = document.createElement('div');
        overlay.className = 'home-card-blacklist-overlay';
        overlay.appendChild(createBlacklistButton(uid, upName));
        homeCardOverlays.set(anchor, { overlay, card });
        homeCardRegistry.set(card, { uid });
        getOverlayRoot().appendChild(overlay);
        positionHomeCardOverlays();
        return true;
    }

    function processHomePage() {
        if (settings.blockAdCards) removeAdCards();

        const sel = HOME_CARD_SELECTORS.join(',');
        const cards = queryAllDeep(sel);
        if (cards.length === 0) return;

        cards.forEach(card => {
            const info = extractHomeOwnerInfo(card);
            if (!info) return;
            const { uid, upName, anchor } = info;
            if (!anchor) return;
            mountHomeCardOverlay(card, anchor, uid, upName);
        });
    }

    function extractHomeOwnerInfo(card) {
        let ownerUrl = '';
        let upName = '';

        const ownerLink = card.querySelector('a.bili-video-card__info--owner');
        let anchor = null;
        if (ownerLink) {
            ownerUrl = ownerLink.getAttribute('href') || '';
            anchor = ownerLink;
            const authorSpan = ownerLink.querySelector('span.bili-video-card__info--author');
            if (authorSpan) {
                upName = authorSpan.getAttribute('title') || authorSpan.textContent.trim();
            } else {
                upName = (ownerLink.textContent || '').trim().split('·')[0].trim();
            }
        } else {
            // 兜底：老版/异构卡片
            for (const fallback of ['.up-name', '.author-text', '.up-name__text']) {
                const el = card.querySelector(fallback);
                if (!el) continue;
                ownerUrl = el.getAttribute('href') || '';
                anchor = el;
                upName = el.textContent.trim();
                break;
            }
        }

        if (!ownerUrl) return null;
        const uid = extractUid(ownerUrl);
        if (!uid) return null;
        return { uid, upName: upName || `UID: ${uid}`, anchor };
    }

    // ==================== 页面处理：视频页 ====================
    let videoPageRetryTimer = null;
    let overlayRoot = null;
    let videoProfileOverlay = null;
    let videoProfileTarget = null;
    const videoCardOverlays = new Map();
    const relationStateCache = new Map();
    const relationRequestCache = new Map();

    function getOverlayRoot() {
        if (overlayRoot) return overlayRoot;

        const host = document.createElement('div');
        host.setAttribute('data-bilibili-blacklist-overlay-host', 'true');
        host.style.cssText = 'position:fixed;inset:0;z-index:1000;pointer-events:none;contain:layout style;';
        document.documentElement.appendChild(host);
        host.attachShadow({ mode: 'open' });
        injectStyleInto(host);
        overlayRoot = host.shadowRoot;
        return overlayRoot;
    }

    function isBlockedRelation(data) {
        const attribute = Number(data && data.attribute);
        return Number.isFinite(attribute) && (attribute & 128) === 128;
    }

    function getRelationState(uid) {
        if (relationStateCache.has(uid)) {
            return Promise.resolve(relationStateCache.get(uid));
        }
        if (relationRequestCache.has(uid)) {
            return relationRequestCache.get(uid);
        }

        const request = fetch(`${API.RELATION}?fid=${encodeURIComponent(uid)}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then(data => {
                if (data.code !== ERR_CODE.OK) {
                    throw new Error(data.message || `错误码 ${data.code}`);
                }
                const blocked = isBlockedRelation(data.data);
                relationStateCache.set(uid, blocked);
                return blocked;
            })
            .catch(err => {
                log('获取用户关系失败:', uid, err);
                relationStateCache.set(uid, null);
                return null;
            })
            .finally(() => {
                relationRequestCache.delete(uid);
            });

        relationRequestCache.set(uid, request);
        return request;
    }

    function removeVideoProfileOverlay() {
        if (videoProfileOverlay) videoProfileOverlay.remove();
        videoProfileOverlay = null;
        videoProfileTarget = null;
    }

    function removeVideoCardOverlays() {
        for (const { overlay } of videoCardOverlays.values()) {
            overlay.remove();
        }
        videoCardOverlays.clear();
    }

    function isVideoPlayerExpanded() {
        return Boolean(document.fullscreenElement || document.querySelector(VIDEO_PLAYER_EXPANDED_SELECTOR));
    }

    function hideVideoCardOverlays() {
        for (const { overlay } of videoCardOverlays.values()) {
            overlay.style.display = 'none';
        }
    }

    function getTextRect(element) {
        if (!element || !element.isConnected) return null;

        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNodes.length === 0) return element.getBoundingClientRect();

        const range = document.createRange();
        range.setStartBefore(textNodes[0]);
        range.setEndAfter(textNodes[textNodes.length - 1]);
        const rect = range.getBoundingClientRect();
        range.detach();
        return rect.width > 0 && rect.height > 0 ? rect : element.getBoundingClientRect();
    }

    function positionVideoProfileOverlay() {
        if (!videoProfileOverlay || !videoProfileTarget || !videoProfileTarget.isConnected) {
            removeVideoProfileOverlay();
            return;
        }

        if (isVideoPlayerExpanded()) {
            videoProfileOverlay.style.display = 'none';
            return;
        }

        const rect = videoProfileTarget.classList.contains('send-msg')
            ? videoProfileTarget.getBoundingClientRect()
            : getTextRect(videoProfileTarget);
        if (!rect) return;
        const outsideViewport = rect.bottom <= 0
            || rect.top >= window.innerHeight
            || rect.right <= 0
            || rect.left >= window.innerWidth;
        if (rect.width === 0 || rect.height === 0 || outsideViewport) {
            videoProfileOverlay.style.display = 'none';
            return;
        }

        videoProfileOverlay.style.display = 'block';
        const overlayWidth = videoProfileOverlay.offsetWidth;
        const overlayHeight = videoProfileOverlay.offsetHeight;
        videoProfileOverlay.style.left = `${Math.max(0, Math.min(rect.right + 8, window.innerWidth - overlayWidth))}px`;
        videoProfileOverlay.style.top = `${Math.max(0, rect.top + (rect.height - overlayHeight) / 2)}px`;
    }

    function positionVideoCardOverlays() {
        if (isVideoPlayerExpanded()) {
            hideVideoCardOverlays();
            return;
        }

        for (const [target, entry] of videoCardOverlays) {
            const { overlay, card } = entry;
            if (!target.isConnected || !card.isConnected) {
                overlay.remove();
                videoCardOverlays.delete(target);
                continue;
            }

            const rect = getTextRect(target);
            if (!rect) continue;
            const outsideViewport = rect.bottom <= 0
                || rect.top >= window.innerHeight
                || rect.right <= 0
                || rect.left >= window.innerWidth;
            if (rect.width === 0 || rect.height === 0 || outsideViewport) {
                overlay.style.display = 'none';
                continue;
            }

            overlay.style.display = 'block';
            const overlayWidth = overlay.offsetWidth;
            const overlayHeight = overlay.offsetHeight;
            const cardRect = card.getBoundingClientRect();
            const preferredLeft = rect.right + 5;
            const maxLeft = Math.min(cardRect.right - overlayWidth, window.innerWidth - overlayWidth);
            overlay.style.left = `${Math.max(cardRect.left, Math.min(preferredLeft, maxLeft))}px`;
            overlay.style.top = `${Math.max(0, rect.top + (rect.height - overlayHeight) / 2)}px`;
        }
    }

    function mountVideoProfileOverlay(target, uid, upName, isBlocked) {
        const existingButton = videoProfileOverlay && videoProfileOverlay.querySelector('.bilibili-blacklist-btn');
        if (videoProfileTarget === target && existingButton && existingButton.dataset.uid === uid) {
            if (isBlocked) markButtonsBlocked(uid);
            positionVideoProfileOverlay();
            return false;
        }

        removeVideoProfileOverlay();
        videoProfileTarget = target;
        videoProfileOverlay = document.createElement('div');
        videoProfileOverlay.className = 'video-upinfo-blacklist-overlay';

        const btn = createBlacklistButton(uid, upName);
        btn.classList.add('video-upinfo-blacklist-btn');
        if (isBlocked) {
            btn.textContent = '已拉黑';
            btn.disabled = true;
        }
        videoProfileOverlay.appendChild(btn);
        getOverlayRoot().appendChild(videoProfileOverlay);
        positionVideoProfileOverlay();
        return true;
    }

    function scheduleVideoProfileOverlay(nameLink, uid, upName) {
        getRelationState(uid).then(isBlocked => {
            if (!settings.videoProfileButton || !nameLink.isConnected) return;

            if (extractUid(nameLink.getAttribute('href')) !== uid) return;

            const top = nameLink.closest('.up-detail-top');
            const anchor = top && top.querySelector(':scope > a.send-msg') || nameLink;
            if (mountVideoProfileOverlay(anchor, uid, upName, isBlocked === true)) {
                log('视频页右侧 UP 信息浮层按钮已添加:', upName, uid, isBlocked === true ? '已拉黑' : '未拉黑');
            }
        });
    }

    function mountVideoCardOverlay(nameEl, card, uid, upName) {
        const existing = videoCardOverlays.get(nameEl);
        if (existing) return false;

        const overlay = document.createElement('div');
        overlay.className = 'video-card-blacklist-overlay';
        overlay.appendChild(createBlacklistButton(uid, upName));
        videoCardOverlays.set(nameEl, { overlay, card });
        getOverlayRoot().appendChild(overlay);
        positionVideoCardOverlays();
        return true;
    }

    function findAndProcessVideoUp() {
        let added = false;
        let profileHandled = false;

        if (settings.videoProfileButton) {
            const containers = document.querySelectorAll('.up-info-container');
            for (const container of containers) {
                const link = container.querySelector('.up-info__detail .up-detail-top > a.up-name[href*="space.bilibili.com"]');
                const top = link && link.closest('.up-detail-top');
                if (!link || !top || top.getClientRects().length === 0) continue;

                const uid = extractUid(link.getAttribute('href'));
                const upName = link.childNodes.length
                    ? Array.from(link.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent.trim())
                        .join('')
                        .trim()
                    : link.textContent.trim();
                if (!uid || !upName) continue;

                scheduleVideoProfileOverlay(link, uid, upName);
                profileHandled = true;
                break;
            }
        } else {
            removeVideoProfileOverlay();
        }

        const upnameDivs = document.querySelectorAll('.card-box .info > div.upname');
        if (upnameDivs.length === 0) return added || profileHandled;

        upnameDivs.forEach(div => {
            const card = div.closest('.video-page-card-small');
            if (!card) return;
            const link = div.querySelector(':scope > a[href*="space.bilibili.com"]');
            if (!link) return;
            const nameEl = link.querySelector(':scope > span.name');
            if (!nameEl) return;

            const upName = nameEl.textContent.trim();
            const uid = extractUid(link.getAttribute('href'));
            if (!uid || !upName) return;

            if (mountVideoCardOverlay(nameEl, card, uid, upName)) {
                added = true;
                log('视频推荐列表浮层按钮已添加:', upName, uid);
            }
        });
        return added || profileHandled;
    }

    function processVideoPage() {
        if (settings.blockAdCards) removeAdCards();
        if (findAndProcessVideoUp()) {
            if (videoPageRetryTimer) { clearInterval(videoPageRetryTimer); videoPageRetryTimer = null; }
            return;
        }
        if (videoPageRetryTimer) return;

        // 视频页 UP 信息有时异步加载，重试几次作为兜底
        let retry = 0;
        videoPageRetryTimer = setInterval(() => {
            retry++;
            if (findAndProcessVideoUp() || retry >= 5) {
                clearInterval(videoPageRetryTimer);
                videoPageRetryTimer = null;
            }
        }, 800);
    }

    // ==================== 统一入口 ====================
    function processPage() {
        try {
            if (location.pathname.startsWith('/video/')) {
                removeHomeCardOverlays();
                processVideoPage();
            } else {
                removeVideoProfileOverlay();
                removeVideoCardOverlays();
                processHomePage();
            }
        } catch (err) {
            log('处理页面出错:', err);
        }
    }

    // ==================== MutationObserver ====================
    let observerInitialized = false;
    let videoPlayerStateObserver = null;

    function pickObserverTarget() {
        const firstOf = (selectors) => {
            for (const s of selectors) {
                const el = document.querySelector(s);
                if (el) return el;
            }
            return null;
        };

        const href = location.href;
        if (href.includes('/video/')) {
            return firstOf(['#app', '.right-container', '#viewbox_report', '.video-info-detail', '#app .left-container']) || document.body;
        }
        if (href.includes('search.bilibili.com')) {
            return firstOf([
                '.video-list', '.search-content', '.search-page',
                '#app .bili-grid', '#app .bili-layout', '#app',
            ]) || document.body;
        }
        return firstOf([
            '#app .feed-list', '#i_cecream', '.bili-grid',
            '#app .bili-layout', '#app',
        ]) || document.body;
    }

    function setupObserver() {
        if (observerInitialized) return;
        observerInitialized = true;

        const debouncedProcess = debounce(processPage, 300);

        const updateVideoOverlayVisibility = () => {
            positionVideoProfileOverlay();
            positionVideoCardOverlays();
        };

        // 网页全屏主要通过播放器 class / data-screen 切换，不一定触发窗口 resize。
        // 监听播放器状态，确保进入时立即隐藏浮层、退出时恢复定位。
        videoPlayerStateObserver = new MutationObserver(mutations => {
            if (!location.pathname.startsWith('/video/')) return;
            const playerStateChanged = mutations.some(m => {
                const target = m.target;
                if (target === document.documentElement || target === document.body) return true;
                return target.nodeType === Node.ELEMENT_NODE
                    && (target.matches(VIDEO_PLAYER_EXPANDED_SELECTOR)
                        || target.matches(VIDEO_PLAYER_ROOT_SELECTOR)
                        || Boolean(target.closest(VIDEO_PLAYER_ROOT_SELECTOR))
                        || Boolean(target.querySelector(VIDEO_PLAYER_ROOT_SELECTOR)));
            });
            if (playerStateChanged) updateVideoOverlayVisibility();
        });
        videoPlayerStateObserver.observe(document.documentElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class', 'data-screen'],
        });

        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    for (const n of m.addedNodes) {
                        if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                            scheduleShadowScan(n);
                        }
                    }
                } else if (m.type === 'attributes' && m.target && m.target.shadowRoot) {
                    scheduleShadowScan(m.target);
                }
            }
            debouncedProcess();
        });

        const target = pickObserverTarget();
        log('观察节点:', target && (target.id || target.className || target.tagName));
        observer.observe(target, { childList: true, subtree: true });
        window.addEventListener('resize', positionVideoProfileOverlay, { passive: true });
        window.addEventListener('scroll', positionVideoProfileOverlay, { passive: true });
        window.addEventListener('resize', positionVideoCardOverlays, { passive: true });
        window.addEventListener('scroll', positionVideoCardOverlays, { passive: true });
        window.addEventListener('resize', positionHomeCardOverlays, { passive: true });
        window.addEventListener('scroll', positionHomeCardOverlays, { passive: true });
        document.addEventListener('fullscreenchange', updateVideoOverlayVisibility);

        // 初始 shadow 扫描 + 延迟处理；避免过早改动 B 站正在挂载的 DOM
        scheduleShadowScan(document.documentElement);
        flushShadowScan();
        setTimeout(processPage, 1500);
        setTimeout(processPage, 3000);

        // 定期清理已 detach 的 shadow root，避免内存泄漏
        setInterval(cleanupShadowRegistry, 30000);
    }

    // ==================== 样式注入 ====================
    function injectGlobalStyle() {
        if (typeof GM_addStyle === 'function') {
            GM_addStyle(STYLES);
        } else {
            const style = document.createElement('style');
            style.textContent = STYLES;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    // ==================== 初始化 ====================
    let initialized = false;
    function init() {
        if (initialized) return;
        initialized = true;

        log(`脚本初始化开始 v${VERSION}`);
        injectGlobalStyle();

        if (!getCookie('bili_jct')) {
            log('警告：未获取到 bili_jct Cookie，用户可能未登录');
            showToast('B站拉黑脚本提示：请先登录 B 站账号！', 5000);
        }

        registerToggleMenus();
        applyHideLiveClass();
        setupObserver();
        updateBlacklistCount();
        log('脚本初始化完成');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
    // 极端情况下的兜底
    setTimeout(() => { if (!initialized) init(); }, 3000);
})();
