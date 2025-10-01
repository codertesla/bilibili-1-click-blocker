// ==UserScript==
// @name         B站一键拉黑UP主
// @description  在B站首页、视频页和搜索页添加拉黑按钮，一键拉黑UP主。完整支持BewlyBewly插件首页布局适配。
// @match        https://bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://www.bilibili.com/video/*
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @version      1.2.0
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @namespace    https://github.com/codertesla/bilibili-1-click-blocker
// @author       codertesla
// @supportURL   https://github.com/codertesla/bilibili-1-click-blocker
// @homepageURL  https://github.com/codertesla/bilibili-1-click-blocker
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js
// @license      MIT
// @updateURL    https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// @downloadURL  https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_NS = 'biliBlacklist';
    const DEBUG_STORAGE_KEY = `${SCRIPT_NS}Debug`;
    let debugEnabled = false;
    try {
        debugEnabled = window.localStorage && window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('[拉黑脚本] 无法读取本地调试配置:', error);
    }

    function log(...args) {
        if (debugEnabled) {
            console.log('[拉黑脚本]', ...args);
        }
    }

    window.biliBlacklistDebugControl = {
        enable() {
            try { window.localStorage.setItem(DEBUG_STORAGE_KEY, 'true'); } catch (error) { console.error('[拉黑脚本] 无法开启调试模式:', error); }
            debugEnabled = true;
            log('调试模式已开启');
        },
        disable() {
            try { window.localStorage.removeItem(DEBUG_STORAGE_KEY); } catch (error) { console.error('[拉黑脚本] 无法关闭调试模式:', error); }
            debugEnabled = false;
            console.log('[拉黑脚本] 调试模式已关闭');
        },
        toggle(force) {
            const nextState = typeof force === 'boolean' ? force : !debugEnabled;
            nextState ? this.enable() : this.disable();
        },
        get enabled() { return debugEnabled; }
    };

    const BILI_BLACKLIST_STYLES = `
        .bilibili-blacklist-btn {
            color: #fb7299 !important;
            cursor: pointer !important;
            font-weight: normal !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1px 6px !important;
            border: 1px solid #fb7299 !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            transition: all 0.2s ease !important;
            background-color: #fff !important;
            box-shadow: 0 0 2px rgba(251, 114, 153, 0.2) !important;
            min-width: auto !important;
            line-height: normal !important;
            text-decoration: none !important;
            gap: 2px !important;
            user-select: none !important;
        }
        .bilibili-blacklist-btn:hover {
            background-color: #fb7299 !important;
            color: #fff !important;
            box-shadow: 0 0 4px rgba(251, 114, 153, 0.35) !important;
        }
        .bilibili-blacklist-btn:active {
            transform: scale(0.95) !important;
        }
        .bilibili-blacklist-btn[data-state="loading"] {
            cursor: wait !important;
            opacity: 0.7 !important;
        }
        .bilibili-blacklist-btn--blocked,
        .bilibili-blacklist-btn[data-state="blocked"] {
            background-color: #eee !important;
            border-color: #ddd !important;
            color: #999 !important;
            cursor: not-allowed !important;
            opacity: 0.8 !important;
        }
        .bili-video-card__info--bottom > .bilibili-blacklist-btn {
            margin-right: 8px !important;
        }
        .upname a > .bilibili-blacklist-btn {
            margin-left: 6px !important;
            font-size: 10px !important;
            padding: 0 5px !important;
        }
        .blacklist-button-container {
            position: absolute !important;
            top: 6px !important;
            right: 6px !important;
            z-index: 50 !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
        }
        .bili-video-card:hover .blacklist-button-container,
        .video-card:hover .blacklist-button-container,
        .feed-card:hover .blacklist-button-container,
        .group\/desc:hover .blacklist-button-container {
            opacity: 1 !important;
        }
        .blacklist-button-container .bilibili-blacklist-btn {
            padding: 0 4px !important;
            font-size: 10px !important;
            margin: 0 !important;
        }
        .bili-blacklist-toast {
            position: fixed !important;
            z-index: 99999 !important;
            top: 30px !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(0) !important;
            background-color: rgba(0, 0, 0, 0.82) !important;
            color: #fff !important;
            padding: 10px 18px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18) !important;
            opacity: 1 !important;
            transition: opacity 0.3s ease, transform 0.3s ease !important;
        }
        .bili-blacklist-toast.is-hiding {
            opacity: 0 !important;
            transform: translateX(-50%) translateY(-18px) !important;
        }
        .bili-blacklist-toast[data-type="error"] {
            background-color: rgba(219, 68, 83, 0.92) !important;
        }
        .bili-blacklist-toast[data-type="warning"] {
            background-color: rgba(255, 170, 0, 0.92) !important;
        }
        .bili-blacklist-toast-icon {
            font-size: 18px !important;
            line-height: 1 !important;
        }
        .bili-blacklist-toast-content {
            line-height: 1.4 !important;
        }
        [data-bili-blacklist-hidden="true"] {
            pointer-events: none !important;
        }
        .group\/desc .channel-name + .bilibili-blacklist-btn {
            margin-left: 8px !important;
            font-size: 10px !important;
            padding: 1px 4px !important;
        }
        .group\/desc .blacklist-button-container {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            opacity: 0 !important;
        }
    `;

    const SELECTORS = {
        feedCards: [
            '.bili-video-card',
            '.bili-video-card__wrap',
            '.feed-card',
            '.video-card',
            '.group\\/desc'
        ],
        searchCards: [
            '.video-list .video-item',
            '.search-content .bili-video-card',
            '.bili-video-card',
            '.video-item.matrix'
        ],
        videoOwnerContainers: [
            'div.upname',
            '.up-info_right'
        ]
    };

    const FEED_CARD_SELECTOR = SELECTORS.feedCards.join(',');
    const SEARCH_CARD_SELECTOR = SELECTORS.searchCards.join(',');
    const VIDEO_OWNER_SELECTOR = SELECTORS.videoOwnerContainers.join(',');

    const MUTATION_PIPELINE = (() => {
        const listeners = new Set();
        return {
            add(listener) { listeners.add(listener); },
            remove(listener) { listeners.delete(listener); },
            dispatch(mutations) {
                listeners.forEach((listener) => {
                    try { listener(mutations); } catch (error) { log('Mutation listener error', error); }
                });
            }
        };
    })();

    const shadowRootListeners = new Set();
    function onShadowRootDiscovered(callback) { shadowRootListeners.add(callback); }
    function notifyShadowRoot(root) {
        shadowRootListeners.forEach((callback) => {
            try { callback(root); } catch (error) { log('Shadow root listener error', error); }
        });
    }

    const buttonEntryMap = new WeakMap();

    const buttonRegistry = (() => {
        const registry = new Map();
        const removedCards = new WeakSet();

        function register(uid, entry) {
            if (!registry.has(uid)) {
                registry.set(uid, new Set());
            }
            registry.get(uid).add(entry);
        }

        function markBlocked(uid) {
            const entries = registry.get(uid);
            if (!entries) { return; }
            entries.forEach((entry) => {
                const { button, card } = entry;
                if (button) {
                    button.textContent = '已拉黑';
                    button.setAttribute('data-state', 'blocked');
                    button.classList.add('bilibili-blacklist-btn--blocked');
                    button.disabled = true;
                    button.ariaDisabled = 'true';
                }
                if (entry.pageType !== 'video' && card && card.isConnected && !removedCards.has(card)) {
                    removedCards.add(card);
                    card.setAttribute('data-bili-blacklist-hidden', 'true');
                    card.style.transition = card.style.transition || 'opacity 0.25s ease';
                    card.style.opacity = '0';
                    window.setTimeout(() => {
                        if (card.parentElement) {
                            card.parentElement.removeChild(card);
                        }
                    }, 250);
                }
            });
        }

        return {
            register,
            markBlocked
        };
    })();

    const BiliToast = (() => {
        let hideTimer = null;
        return {
            show(message, { type = 'info', duration = 3000 } = {}) {
                if (!message) { return; }
                if (hideTimer) { window.clearTimeout(hideTimer); hideTimer = null; }
                const existing = document.querySelector('.bili-blacklist-toast');
                if (existing) { existing.remove(); }

                const toast = document.createElement('div');
                toast.className = 'bili-blacklist-toast';
                toast.dataset.type = type;

                const icon = document.createElement('span');
                icon.className = 'bili-blacklist-toast-icon';
                icon.textContent = type === 'error' ? '✕' : (type === 'warning' ? '!' : '✓');

                const content = document.createElement('div');
                content.className = 'bili-blacklist-toast-content';
                content.textContent = message;

                toast.append(icon, content);
                document.body.appendChild(toast);

                hideTimer = window.setTimeout(() => {
                    toast.classList.add('is-hiding');
                    window.setTimeout(() => toast.remove(), 300);
                }, duration);
            }
        };
    })();

    function sanitizeText(value) {
        return (value || '').replace(/\s+/g, ' ').trim();
    }

    function extractUidFromUrl(rawUrl) {
        if (!rawUrl) { return ''; }
        let normalized = rawUrl;
        try {
            normalized = new URL(rawUrl, window.location.origin).href;
        } catch (error) {
            // ignore URL parsing failures and fallback to raw string matching
        }
        const patterns = [
            /space\.bilibili\.com\/(\d+)/i,
            /\/space\/(\d+)/i,
            /\/u\/(\d+)/i
        ];
        for (const pattern of patterns) {
            const match = normalized.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        const fallback = normalized.match(/\/(\d+)(?:[/?#]|$)/);
        return fallback && fallback[1] ? fallback[1] : '';
    }

    function getCsrfToken() {
        const name = 'bili_jct';
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) {
                return value || '';
            }
        }
        return '';
    }

    async function blockUser(uid, csrfToken) {
        const endpoint = 'https://api.bilibili.com/x/relation/modify';
        const payload = new URLSearchParams({
            fid: uid,
            act: '5',
            re_src: '11',
            gaia_source: 'web_main',
            csrf: csrfToken
        });

        let response;
        try {
            response = await window.fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: payload.toString()
            });
        } catch (error) {
            const networkError = new Error('网络请求失败');
            networkError.userMessage = '拉黑请求失败，请检查网络或登录状态';
            networkError.cause = error;
            throw networkError;
        }

        if (!response.ok) {
            const httpError = new Error(`HTTP ${response.status}`);
            httpError.userMessage = `拉黑失败：服务暂时不可用 (HTTP ${response.status})`;
            throw httpError;
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            const parseError = new Error('响应解析失败');
            parseError.userMessage = '拉黑失败：无法解析服务器响应';
            parseError.cause = error;
            throw parseError;
        }

        if (data.code !== 0 && data.code !== 22120) {
            const apiError = new Error(data.message || `API code ${data.code}`);
            apiError.userMessage = `拉黑失败：${data.message || `错误码 ${data.code}`}`;
            apiError.apiCode = data.code;
            throw apiError;
        }

        return data;
    }

    function createMenuController() {
        const state = {
            total: 0,
            menuId: null
        };

        const formatTitle = () => `去管理黑名单 --（ ${state.total > 0 ? `总共：${state.total} ）` : '请留意黑名单数量 ）' }`;

        function unregister() {
            if (state.menuId !== null && typeof GM_unregisterMenuCommand === 'function') {
                try { GM_unregisterMenuCommand(state.menuId); } catch (error) { log('解除GM菜单失败', error); }
                state.menuId = null;
            }
        }

        function register() {
            unregister();
            if (typeof GM_registerMenuCommand === 'function') {
                try {
                    state.menuId = GM_registerMenuCommand(formatTitle(), () => {
                        window.open('https://account.bilibili.com/account/blacklist', '_blank');
                    });
                } catch (error) {
                    log('注册GM菜单失败', error);
                }
            }
        }

        register();

        return {
            update(total) {
                if (typeof total === 'number' && total >= 0 && total !== state.total) {
                    state.total = total;
                    register();
                }
            },
            dispose() { unregister(); }
        };
    }

    const menuController = createMenuController();
    let lastBlacklistFetch = 0;
    const BLACKLIST_REFRESH_INTERVAL = 30 * 1000;

    async function updateBlacklistCount(force = false) {
        const now = Date.now();
        if (!force && now - lastBlacklistFetch < BLACKLIST_REFRESH_INTERVAL) {
            return;
        }
        lastBlacklistFetch = now;
        try {
            const response = await window.fetch('https://api.bilibili.com/x/relation/blacks?re_version=0&pn=1&ps=20&jsonp=jsonp&web_location=333.33', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) { throw new Error(`HTTP ${response.status}`); }
            const data = await response.json();
            if (data.code === 0 && data.data && typeof data.data.total === 'number') {
                menuController.update(data.data.total);
            }
        } catch (error) {
            log('获取黑名单数量失败', error);
        }
    }

    const StyleManager = (() => {
        const STYLE_MARK = 'data-bili-blacklist-style';
        const processedRoots = new WeakSet();

        function ensureDocumentStyle() {
            if (!document.head.querySelector(`style[${STYLE_MARK}]`)) {
                const style = document.createElement('style');
                style.setAttribute(STYLE_MARK, '');
                style.textContent = BILI_BLACKLIST_STYLES;
                document.head.appendChild(style);
            }
        }

        function injectIntoShadowRoot(root) {
            if (!root || processedRoots.has(root)) { return; }
            try {
                const style = document.createElement('style');
                style.setAttribute(STYLE_MARK, '');
                style.textContent = BILI_BLACKLIST_STYLES;
                root.appendChild(style);
                processedRoots.add(root);
                notifyShadowRoot(root);
            } catch (error) {
                log('向ShadowRoot注入样式失败', error);
            }
        }

        function inspectNode(node) {
            if (!node) { return; }
            if (node instanceof Element && node.shadowRoot) {
                injectIntoShadowRoot(node.shadowRoot);
            }
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, null);
            while (walker.nextNode()) {
                const current = walker.currentNode;
                if (current.shadowRoot) {
                    injectIntoShadowRoot(current.shadowRoot);
                }
            }
        }

        return {
            init() {
                ensureDocumentStyle();
                injectIntoShadowRoot(document.documentElement.shadowRoot);
                inspectNode(document.documentElement);
            },
            handleMutations(mutations) {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof Element || node instanceof DocumentFragment) {
                            inspectNode(node);
                        }
                    });
                });
            }
        };
    })();

    const ObserverManager = (() => {
        const observedNodes = new WeakSet();

        function observe(node) {
            if (!node || observedNodes.has(node)) { return; }
            try {
                const observer = new MutationObserver((mutations) => {
                    MUTATION_PIPELINE.dispatch(mutations);
                });
                observer.observe(node, { childList: true, subtree: true });
                observedNodes.add(node);
                log('已监听节点变化:', node.nodeName || node);
            } catch (error) {
                log('监听节点失败', error);
            }
        }

        return {
            init() {
                observe(document.documentElement);
                observe(document.body);
                onShadowRootDiscovered((root) => observe(root));
            }
        };
    })();

    function detectPageType(url = window.location.href) {
        let parsed;
        try { parsed = new URL(url, window.location.origin); } catch (error) { return 'feed'; }
        const { hostname, pathname } = parsed;
        if (hostname.startsWith('search.')) { return 'search'; }
        if (pathname.startsWith('/video/')) { return 'video'; }
        return 'feed';
    }

    const LocationWatcher = (() => {
        const listeners = new Set();
        let lastHref = window.location.href;

        function notify() {
            const current = window.location.href;
            if (current === lastHref) { return; }
            const previous = lastHref;
            lastHref = current;
            listeners.forEach((listener) => {
                try { listener(current, previous); } catch (error) { log('Location listener error', error); }
            });
        }

        window.addEventListener('popstate', () => window.queueMicrotask(notify));
        window.addEventListener('hashchange', () => window.queueMicrotask(notify));

        const originalPushState = history.pushState;
        if (typeof originalPushState === 'function') {
            history.pushState = function (...args) {
                const result = originalPushState.apply(this, args);
                window.queueMicrotask(notify);
                return result;
            };
        }
        const originalReplaceState = history.replaceState;
        if (typeof originalReplaceState === 'function') {
            history.replaceState = function (...args) {
                const result = originalReplaceState.apply(this, args);
                window.queueMicrotask(notify);
                return result;
            };
        }

        return {
            add(listener) { listeners.add(listener); },
            remove(listener) { listeners.delete(listener); }
        };
    })();

    function createBlacklistButton({ uid, upName, pageType, card }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bilibili-blacklist-btn';
        button.textContent = '拉黑';
        button.dataset.uid = uid;

        const entry = { uid, upName, button, pageType, card, originalText: '拉黑' };
        buttonEntryMap.set(button, entry);
        buttonRegistry.register(uid, entry);

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleBlockRequest(uid, upName, button);
        });

        return button;
    }

    function setButtonLoading(button, isLoading, text = '处理中...') {
        if (!button) { return; }
        if (isLoading) {
            button.dataset.state = 'loading';
            button.disabled = true;
            button.textContent = text;
        } else if (button.dataset.state === 'loading') {
            const entry = buttonEntryMap.get(button);
            button.textContent = (entry && entry.originalText) || '拉黑';
            button.disabled = false;
            button.dataset.state = '';
            button.removeAttribute('data-state');
        }
    }

    async function handleBlockRequest(uid, upName, button) {
        const entry = buttonEntryMap.get(button);
        if (!entry) { return; }
        if (button.dataset.state === 'loading' || button.dataset.state === 'blocked') {
            return;
        }
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
            BiliToast.show('请先登录B站账号后再使用一键拉黑功能', { type: 'warning', duration: 4000 });
            return;
        }

        setButtonLoading(button, true);
        try {
            const result = await blockUser(uid, csrfToken);
            if (result.code === 22120) {
                BiliToast.show('该用户已在黑名单中', { type: 'info' });
            } else {
                BiliToast.show(`已成功将 “${upName || 'UP主'}” 加入黑名单`, { type: 'success' });
            }
            buttonRegistry.markBlocked(uid);
            updateBlacklistCount(true);
        } catch (error) {
            log('拉黑请求失败', error);
            BiliToast.show(error.userMessage || '拉黑请求失败，请检查网络或登录状态', { type: 'error', duration: 4000 });
            setButtonLoading(button, false);
        }
    }

    function findOwnerInfoInCard(card) {
        if (!card) { return null; }
        const ownerLink = card.querySelector('a.bili-video-card__info--owner')
            || card.querySelector('.upname a[href*="space"]')
            || card.querySelector('a.channel-name')
            || card.querySelector('a[href*="//space.bilibili.com/"]')
            || card.querySelector('a[href*="/space/"]');

        if (!ownerLink) { return null; }
        const uid = extractUidFromUrl(ownerLink.getAttribute('href'));
        if (!uid) { return null; }
        const nameSource = ownerLink.querySelector('[title]') || ownerLink;
        const upName = sanitizeText(nameSource.getAttribute('title') || nameSource.textContent) || `UID ${uid}`;
        return { uid, upName, anchor: ownerLink };
    }

    function placeButtonInCard(card, button, ownerInfo) {
        if (!card || !button) { return false; }

        const existing = card.querySelector(`.bilibili-blacklist-btn[data-uid="${ownerInfo.uid}"]`);
        if (existing) { return false; }

        if (ownerInfo.anchor && ownerInfo.anchor.parentElement) {
            ownerInfo.anchor.insertAdjacentElement('afterend', button);
            return true;
        }

        const infoBottom = card.querySelector('.bili-video-card__info--bottom');
        if (infoBottom) {
            infoBottom.insertAdjacentElement('afterbegin', button);
            return true;
        }

        if (!card.style.position || card.style.position === 'static') {
            card.style.position = 'relative';
        }
        let container = card.querySelector('.blacklist-button-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'blacklist-button-container';
            card.appendChild(container);
        }
        container.appendChild(button);
        return true;
    }

    function processFeedCard(card, pageType) {
        if (!card || card.dataset.blacklistProcessed === 'true') { return; }
        const ownerInfo = findOwnerInfoInCard(card);
        if (!ownerInfo) { return; }
        const button = createBlacklistButton({ uid: ownerInfo.uid, upName: ownerInfo.upName, pageType, card });
        const placed = placeButtonInCard(card, button, ownerInfo);
        if (placed) {
            card.dataset.blacklistProcessed = 'true';
            card.dataset.upId = ownerInfo.uid;
            log(`已为${pageType}卡片添加按钮`, ownerInfo.uid, ownerInfo.upName);
        }
    }

    function processVideoContainer(container) {
        if (!container || container.dataset.blacklistProcessed === 'true') { return; }
        const ownerLink = container.querySelector('a[href*="//space.bilibili.com/"]')
            || container.querySelector('a[href*="/space/"]');
        if (!ownerLink) { return; }
        const uid = extractUidFromUrl(ownerLink.getAttribute('href'));
        if (!uid) { return; }
        const nameNode = container.querySelector('.name') || ownerLink.querySelector('.name') || ownerLink;
        const upName = sanitizeText(nameNode.textContent) || `UID ${uid}`;
        if (container.querySelector(`.bilibili-blacklist-btn[data-uid="${uid}"]`)) {
            container.dataset.blacklistProcessed = 'true';
            return;
        }
        const button = createBlacklistButton({ uid, upName, pageType: 'video', card: container });
        if (nameNode && nameNode.parentElement) {
            nameNode.insertAdjacentElement('afterend', button);
        } else {
            ownerLink.insertAdjacentElement('afterend', button);
        }
        container.dataset.blacklistProcessed = 'true';
        log('已为视频页UP主添加按钮', uid, upName);
    }

    function createFeedLikeHandler(pageType, selector) {
        const selectorString = selector;
        const selectors = selector.split(',').map((s) => s.trim()).filter(Boolean);

        function matches(element) {
            return selectors.some((sel) => {
                try { return element.matches(sel); } catch (error) { return false; }
            });
        }

        function locateCard(element) {
            for (const sel of selectors) {
                try {
                    const match = element.closest(sel);
                    if (match) { return match; }
                } catch (error) {
                    // ignore invalid selector on closest
                }
            }
            return null;
        }

        function collectCardsFromNode(node, collector) {
            if (node instanceof Element) {
                if (matches(node)) {
                    const card = locateCard(node) || node;
                    collector.add(card);
                }
                node.querySelectorAll(selectorString).forEach((el) => collector.add(el));
            } else if (node instanceof DocumentFragment) {
                node.querySelectorAll(selectorString).forEach((el) => collector.add(el));
            }
        }

        return {
            init() {},
            teardown() {},
            processExisting(root = document) {
                root.querySelectorAll(selectorString).forEach((card) => processFeedCard(card, pageType));
            },
            handleMutations(mutations) {
                const cards = new Set();
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => collectCardsFromNode(node, cards));
                });
                cards.forEach((card) => processFeedCard(card, pageType));
            }
        };
    }

    function createVideoHandler() {
        function collectContainersFromNode(node, collector) {
            if (node instanceof Element) {
                if (node.matches(VIDEO_OWNER_SELECTOR)) {
                    collector.add(node);
                }
                node.querySelectorAll(VIDEO_OWNER_SELECTOR).forEach((el) => collector.add(el));
            } else if (node instanceof DocumentFragment) {
                node.querySelectorAll(VIDEO_OWNER_SELECTOR).forEach((el) => collector.add(el));
            }
        }

        return {
            init() {},
            teardown() {},
            processExisting(root = document) {
                root.querySelectorAll(VIDEO_OWNER_SELECTOR).forEach(processVideoContainer);
            },
            handleMutations(mutations) {
                const containers = new Set();
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => collectContainersFromNode(node, containers));
                });
                containers.forEach(processVideoContainer);
            }
        };
    }

    const PageHandlers = {
        feed: createFeedLikeHandler('feed', FEED_CARD_SELECTOR),
        search: createFeedLikeHandler('search', SEARCH_CARD_SELECTOR),
        video: createVideoHandler()
    };

    const PageManager = (() => {
        let currentType = detectPageType();
        let currentHandler = PageHandlers[currentType] || PageHandlers.feed;
        currentHandler.init();

        function handleMutations(mutations) {
            currentHandler && currentHandler.handleMutations && currentHandler.handleMutations(mutations);
        }

        MUTATION_PIPELINE.add((mutations) => StyleManager.handleMutations(mutations));
        MUTATION_PIPELINE.add(handleMutations);

        LocationWatcher.add(() => {
            const nextType = detectPageType();
            if (nextType === currentType) { return; }
            log(`页面类型变化: ${currentType} -> ${nextType}`);
            currentHandler && currentHandler.teardown && currentHandler.teardown();
            currentType = nextType;
            currentHandler = PageHandlers[currentType] || PageHandlers.feed;
            currentHandler.init();
            currentHandler.processExisting(document);
        });

        return {
            processExisting(root) {
                currentHandler && currentHandler.processExisting && currentHandler.processExisting(root);
            }
        };
    })();

    function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    onReady(() => {
        log('脚本初始化开始');
        StyleManager.init();
        ObserverManager.init();
        PageManager.processExisting(document);
        updateBlacklistCount(true);
        window.blacklistScript = {
            refresh() {
                PageManager.processExisting(document);
            }
        };
        log('脚本初始化完成');
    });
})();
