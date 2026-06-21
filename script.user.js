// ==UserScript==
// @name         B站一键拉黑UP主
// @description  在B站首页、视频页和搜索页添加拉黑按钮，一键拉黑UP主。支持首页隐藏直播卡片、屏蔽广告卡片。
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @version      1.6.0
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
    const VERSION = '1.6.0';

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

    // 只观察脚本真正负责的内容区。视频页故意不包含播放器和左侧主内容区。
    const PAGE_OBSERVER_SELECTORS = {
        video: ['.right-container'],
        search: ['.video-list', '.search-content', '.search-page', '#app .bili-grid', '#app .bili-layout'],
        home: ['#app .feed-list', '#i_cecream', '.bili-grid', '#app .bili-layout'],
    };

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
        @keyframes biliBlacklistFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .bilibili-blacklist-btn { animation: biliBlacklistFadeIn 0.3s ease-out !important; }

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

        /* 受控内联按钮：跟随页面原生布局、裁剪和层叠关系 */
        .bili-blacklist-inline {
          display: inline-flex !important;
          align-items: center !important;
          flex: 0 0 auto !important;
          vertical-align: middle !important;
          margin-left: 6px !important;
        }
        .bili-blacklist-inline > .bilibili-blacklist-btn {
          margin: 0 !important;
          font-size: 11px !important;
          padding: 1px 5px !important;
          line-height: normal !important;
        }
        .bili-blacklist-inline--profile {
          margin-left: auto !important;
          padding-left: 8px !important;
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
          animation: biliBlacklistToastIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        @keyframes biliBlacklistToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) !important; }
          to { opacity: 1; transform: translateX(-50%) translateY(0) !important; }
        }
        .bili-blacklist-toast-icon { font-size: 18px !important; line-height: 1 !important; }
        .bili-blacklist-toast-content { line-height: 1.5 !important; }

        /* 隐藏直播卡片 */
        body.hide-live-cards .floor-single-card:has(.floor-title) {
          display: none !important;
        }

        /* 广告过滤：只隐藏，不删除 Vue 管理的节点，避免破坏 hydration */
        body.bili-blacklist-block-ads #slide_ad,
        body.bili-blacklist-block-ads .video-card-ad-small,
        body.bili-blacklist-block-ads .video-page-special-card-small:has(a[href*="specialRecommendByOp"]),
        body.bili-blacklist-block-ads .bili-blacklist-hidden-ad-card {
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

    // ==================== DOM 边界工具 ====================
    function collectRelated(root, selector) {
        const results = [];
        const seen = new Set();
        const add = (el) => {
            if (el && !seen.has(el)) {
                seen.add(el);
                results.push(el);
            }
        };

        if (!root) return results;
        if (root.nodeType === Node.ELEMENT_NODE) {
            if (root.matches(selector)) add(root);
            add(root.closest(selector));
        }
        if (typeof root.querySelectorAll === 'function') {
            root.querySelectorAll(selector).forEach(add);
        }
        return results;
    }

    function isInsideVideoPlayer(node) {
        const el = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
        return Boolean(el && el.closest(VIDEO_PLAYER_ROOT_SELECTOR));
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
        document.querySelectorAll(`.bilibili-blacklist-btn[data-uid="${uid}"]`).forEach(btn => {
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
        const cardSel = [
            `[data-bili-blacklist-card-uid="${uid}"]`,
            `.bili-video-card[data-up-id="${uid}"]`,
            `.feed-card[data-up-id="${uid}"]`,
            `.video-card[data-up-id="${uid}"]`,
            `.group\\/desc[data-up-id="${uid}"]`,
            `div.uid_${uid}`,
        ].join(',');
        document.querySelectorAll(cardSel).forEach(el => fadeOutAndRemove(el));
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
                applyAdFilterState();
                showToast(settings.blockAdCards ? '已开启广告屏蔽' : '已关闭广告屏蔽');
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
                    removeInlineButtons('profile');
                }
                showToast(settings.videoProfileButton ? '已开启视频页 UP 主信息拉黑按钮' : '已关闭视频页 UP 主信息拉黑按钮');
            }
        );
    }

    // ==================== 非破坏式广告过滤 ====================
    function markAdCards(root = document) {
        if (!settings.blockAdCards || !root) return;
        collectRelated(root, '.bili-video-card__stats--text, .bili-video-card__info--text-ad').forEach(el => {
            if (el.textContent.trim() !== '广告') return;
            const card = el.closest('.feed-card, .bili-video-card, .video-card, .floor-single-card');
            if (card) card.classList.add('bili-blacklist-hidden-ad-card');
        });
    }

    function applyAdFilterState() {
        if (!document.body) return;
        document.body.classList.toggle('bili-blacklist-block-ads', settings.blockAdCards);
        if (settings.blockAdCards) {
            markAdCards(document);
        } else {
            document.querySelectorAll('.bili-blacklist-hidden-ad-card').forEach(card => {
                card.classList.remove('bili-blacklist-hidden-ad-card');
            });
        }
    }

    // ==================== 受控内联挂载 ====================
    function createInlineMount(kind, uid, upName, isBlocked = false) {
        const mount = document.createElement('span');
        mount.className = `bili-blacklist-inline bili-blacklist-inline--${kind}`;
        mount.dataset.biliBlacklistKind = kind;
        mount.dataset.biliBlacklistUid = uid;

        const btn = createBlacklistButton(uid, upName);
        if (isBlocked) {
            btn.textContent = '已拉黑';
            btn.disabled = true;
        }
        mount.appendChild(btn);
        return mount;
    }

    function mountInlineButton(scope, kind, uid, upName, insert, isBlocked = false) {
        if (!scope || !scope.isConnected) return false;
        const selector = `.bili-blacklist-inline--${kind}`;
        const existing = scope.querySelector(selector);
        if (existing && existing.dataset.biliBlacklistUid === uid) {
            if (isBlocked) markButtonsBlocked(uid);
            return false;
        }
        if (existing) existing.remove();

        const mount = createInlineMount(kind, uid, upName, isBlocked);
        insert(mount);
        return mount.isConnected;
    }

    function removeInlineButtons(kind = '') {
        const selector = kind ? `.bili-blacklist-inline--${kind}` : '.bili-blacklist-inline';
        document.querySelectorAll(selector).forEach(mount => mount.remove());
    }

    // ==================== 页面处理：首页 / 搜索页 ====================
    function mountHomeCardInline(card, anchor, uid, upName) {
        if (!anchor.parentElement || !card.contains(anchor)) return false;
        card.dataset.biliBlacklistCardUid = uid;
        return mountInlineButton(card, 'home', uid, upName, mount => {
            anchor.insertAdjacentElement('afterend', mount);
        });
    }

    function processHomePage(root = document) {
        markAdCards(root);

        const sel = HOME_CARD_SELECTORS.join(',');
        const cards = collectRelated(root, sel);
        if (cards.length === 0) return;

        cards.forEach(card => {
            const info = extractHomeOwnerInfo(card);
            if (!info) return;
            const { uid, upName, anchor } = info;
            if (!anchor) return;
            mountHomeCardInline(card, anchor, uid, upName);
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
    const relationStateCache = new Map();
    const relationRequestCache = new Map();

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
                // 60s 后清除失败缓存，允许后续重试，避免一次网络波动导致永久显示未拉黑。
                setTimeout(() => relationStateCache.delete(uid), 60000);
                return null;
            })
            .finally(() => {
                relationRequestCache.delete(uid);
            });

        relationRequestCache.set(uid, request);
        return request;
    }

    function mountVideoProfileInline(top, uid, upName, isBlocked) {
        return mountInlineButton(top, 'profile', uid, upName, mount => {
            top.appendChild(mount);
        }, isBlocked);
    }

    function scheduleVideoProfileInline(nameLink, uid, upName) {
        getRelationState(uid).then(isBlocked => {
            if (!settings.videoProfileButton || !nameLink.isConnected) return;
            if (extractUid(nameLink.getAttribute('href')) !== uid) return;

            const top = nameLink.closest('.up-detail-top');
            if (top && mountVideoProfileInline(top, uid, upName, isBlocked === true)) {
                log('视频页右侧 UP 信息内联按钮已添加:', upName, uid, isBlocked === true ? '已拉黑' : '未拉黑');
            }
        });
    }

    function mountVideoCardInline(link, card, uid, upName) {
        if (!link.parentElement || !card.contains(link)) return false;
        card.dataset.biliBlacklistCardUid = uid;
        return mountInlineButton(card, 'video-card', uid, upName, mount => {
            link.insertAdjacentElement('afterend', mount);
        });
    }

    function processVideoProfileContainer(container) {
        if (!settings.videoProfileButton || !container || !container.isConnected) return false;
        const link = container.querySelector('.up-info__detail .up-detail-top > a.up-name[href*="space.bilibili.com"]');
        const top = link && link.closest('.up-detail-top');
        if (!link || !top || top.getClientRects().length === 0) return false;

        const uid = extractUid(link.getAttribute('href'));
        const upName = Array.from(link.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .join('')
            .trim() || link.textContent.trim();
        if (!uid || !upName) return false;

        scheduleVideoProfileInline(link, uid, upName);
        return true;
    }

    function processVideoRecommendationCard(card) {
        if (!card || !card.isConnected) return false;
        const div = card.querySelector('.card-box .info > div.upname');
        const link = div && div.querySelector(':scope > a[href*="space.bilibili.com"]');
        const nameEl = link && link.querySelector(':scope > span.name');
        if (!link || !nameEl) return false;

        const upName = nameEl.textContent.trim();
        const uid = extractUid(link.getAttribute('href'));
        if (!uid || !upName) return false;

        if (!mountVideoCardInline(link, card, uid, upName)) return false;
        log('视频推荐列表内联按钮已添加:', upName, uid);
        return true;
    }

    function findAndProcessVideoUp(root = document) {
        let profileHandled = false;
        let cardAdded = false;

        if (settings.videoProfileButton) {
            const containers = collectRelated(root, '.up-info-container');
            for (const container of containers) {
                if (processVideoProfileContainer(container)) {
                    profileHandled = true;
                    break;
                }
            }
        } else {
            removeInlineButtons('profile');
        }

        collectRelated(root, '.video-page-card-small').forEach(card => {
            if (processVideoRecommendationCard(card)) cardAdded = true;
        });
        return { profileHandled, cardAdded };
    }

    function scheduleVideoPageRetry() {
        if (videoPageRetryTimer || !settings.videoProfileButton) return;
        let retry = 0;
        videoPageRetryTimer = setInterval(() => {
            retry++;
            const { profileHandled } = findAndProcessVideoUp(document);
            if (profileHandled || retry >= 5) {
                clearInterval(videoPageRetryTimer);
                videoPageRetryTimer = null;
            }
        }, 800);
    }

    function processVideoPage(root = document, allowRetry = root === document) {
        markAdCards(root);
        const result = findAndProcessVideoUp(root);
        if (result.profileHandled && videoPageRetryTimer) {
            clearInterval(videoPageRetryTimer);
            videoPageRetryTimer = null;
        } else if (allowRetry && !result.profileHandled) {
            scheduleVideoPageRetry();
        }
    }

    // ==================== 统一入口 ====================
    function getPageKind() {
        if (location.pathname.startsWith('/video/')) return 'video';
        if (location.hostname === 'search.bilibili.com') return 'search';
        return 'home';
    }

    function processPageRoot(root = document, allowRetry = root === document) {
        if (!root || isInsideVideoPlayer(root)) return;
        try {
            if (getPageKind() === 'video') {
                processVideoPage(root, allowRetry);
            } else {
                processHomePage(root);
            }
        } catch (err) {
            log('处理页面出错:', err);
        }
    }

    function processPage() {
        processPageRoot(document, true);
    }

    // ==================== MutationObserver ====================
    let observerInitialized = false;
    let contentObserver = null;
    let contentObserverTargets = [];
    let observerRebindTimer = null;
    let activeRouteKey = '';
    const pendingContentRoots = new Set();
    let contentFrameId = 0;

    function pickObserverTargets() {
        const selectors = PAGE_OBSERVER_SELECTORS[getPageKind()];
        const candidates = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
            .filter(el => el.isConnected && !isInsideVideoPlayer(el));
        const unique = Array.from(new Set(candidates));
        // 如果外层容器已被观察，不再重复观察其子容器。
        return unique.filter(el => !unique.some(other => other !== el && other.contains(el)));
    }

    function scheduleObserverRebind(delay = 400) {
        if (observerRebindTimer) clearTimeout(observerRebindTimer);
        observerRebindTimer = setTimeout(() => {
            observerRebindTimer = null;
            bindContentObserver();
        }, delay);
    }

    function bindContentObserver() {
        if (!contentObserver) return;
        const targets = pickObserverTargets();
        const unchanged = targets.length === contentObserverTargets.length
            && targets.every((el, index) => el === contentObserverTargets[index] && el.isConnected);
        if (unchanged) return;

        contentObserver.disconnect();
        contentObserverTargets = targets;
        targets.forEach(target => contentObserver.observe(target, { childList: true, subtree: true }));
        log('观察节点:', targets.map(el => el.id || el.className || el.tagName));
        if (targets.length === 0) scheduleObserverRebind(500);
    }

    function scheduleContentRoot(root) {
        pendingContentRoots.add(root);
        if (contentFrameId) return;
        // 等页面框架完成本帧渲染后再内联挂载，避免介入 Vue 的同步 patch/hydration。
        contentFrameId = requestAnimationFrame(() => {
            contentFrameId = 0;
            const roots = Array.from(pendingContentRoots);
            pendingContentRoots.clear();
            roots.forEach(item => {
                if (item.isConnected) processPageRoot(item, false);
            });
        });
    }

    function handleContentMutations(mutations) {
        const roots = new Set();
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                const root = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                if (!root || isInsideVideoPlayer(root)) continue;
                if (root.closest('.bili-blacklist-inline')) continue;
                roots.add(root);
            }
        }
        roots.forEach(scheduleContentRoot);
    }

    function resetPageState() {
        if (observerRebindTimer) {
            clearTimeout(observerRebindTimer);
            observerRebindTimer = null;
        }
        if (videoPageRetryTimer) {
            clearInterval(videoPageRetryTimer);
            videoPageRetryTimer = null;
        }
        if (contentFrameId) {
            cancelAnimationFrame(contentFrameId);
            contentFrameId = 0;
        }
        pendingContentRoots.clear();
        removeInlineButtons();
    }

    function handleRouteChange() {
        resetPageState();
        bindContentObserver();
        requestAnimationFrame(processPage);
        setTimeout(() => {
            bindContentObserver();
            processPage();
        }, 600);
    }

    function setupObserver() {
        if (observerInitialized) return;
        observerInitialized = true;

        contentObserver = new MutationObserver(handleContentMutations);
        activeRouteKey = `${location.hostname}${location.pathname}`;
        bindContentObserver();

        // 轮询只负责 SPA 路由和容器替换，不读取或改写页面业务 DOM。
        setInterval(() => {
            const routeKey = `${location.hostname}${location.pathname}`;
            if (routeKey !== activeRouteKey) {
                activeRouteKey = routeKey;
                handleRouteChange();
                return;
            }
            if (contentObserverTargets.length === 0 || contentObserverTargets.some(el => !el.isConnected)) {
                bindContentObserver();
                processPage();
            }
        }, 800);

        setTimeout(processPage, 300);
        setTimeout(() => {
            bindContentObserver();
            processPage();
        }, 1500);
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
        applyAdFilterState();
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
