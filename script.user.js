// ==UserScript==
// @name         B站首页和视频页一键拉黑UP主
// @description  在B站首页和视频页添加拉黑按钮，一键拉黑UP主。修复导航栏消失和首页按钮问题。
// @match        https://bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @version      1.1.1
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addStyle
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

    // 调试功能
    const DEBUG = true;
    function log(...args) {
        if (DEBUG) {
            console.log('[拉黑脚本]', ...args);
        }
    }

    // 等待jQuery加载
    function waitForJQuery(callback) {
        if (typeof jQuery !== 'undefined') {
            log('jQuery已加载');
            callback(jQuery);
        } else {
            log('等待jQuery加载...');
            setTimeout(function () { waitForJQuery(callback); }, 50);
        }
    }

    // --- (可选) Debounce 函数 ---
    /*
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    */
    // ---

    // 主函数
    waitForJQuery(function ($) {
        log('脚本初始化开始 v1.0.8-fixed');

        // 添加样式 (保持不变)
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(`
                /* 通用按钮样式 */
                .bilibili-blacklist-btn {
                  color: #fb7299 !important;
                  cursor: pointer !important;
                  font-weight: normal !important;
                  display: inline-flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  padding: 1px 5px !important;
                  border: 1px solid #fb7299 !important;
                  border-radius: 4px !important;
                  font-size: 11px !important; /* 统一基础字号 */
                  transition: all 0.2s ease !important;
                  background-color: white !important;
                  box-shadow: 0 0 2px rgba(251, 114, 153, 0.2) !important;
                  width: auto !important;
                  min-width: unset !important;
                  max-width: none !important;
                  box-sizing: border-box !important;
                  text-align: center !important;
                  white-space: nowrap !important;
                  gap: 1px !important;
                  vertical-align: middle; /* 垂直对齐 */
                  line-height: normal; /* 正常行高 */
                  margin: 0 5px 0 0 !important; /* 默认右边距，给后面元素空间 */
                }
                .bilibili-blacklist-btn:hover {
                  background-color: #fb7299 !important;
                  color: white !important;
                  box-shadow: 0 0 4px rgba(251, 114, 153, 0.4) !important;
                }
                .bilibili-blacklist-btn:active {
                  transform: scale(0.95) !important;
                }
                .bilibili-blacklist-btn::before {
                  content: "" !important; margin-right: 0 !important; width: 0 !important;
                }
                /* 按钮动画 */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .bilibili-blacklist-btn { animation: fadeIn 0.3s ease-out !important; }

                /* --- 首页特定调整 --- */
                /* 将按钮添加到 info--bottom 前面时 */
                .bili-video-card__info--bottom > .bilibili-blacklist-btn {
                  /* 首页按钮放在前面，给右边距 */
                  margin-right: 8px !important;
                  margin-left: 0 !important;
                }

                 /* --- 视频页特定调整 --- */
                /* 将按钮添加到 upname > a > span.name 后面时 */
                .upname a > .bilibili-blacklist-btn {
                   margin-left: 5px !important; /* 视频页按钮放名字后面，给左边距 */
                   margin-right: 0 !important;
                   font-size: 10px !important; /* 视频页按钮可以小一点 */
                   padding: 0px 4px !important;
                }

                /* --- 卡片悬浮按钮特定调整 --- */
                .blacklist-button-container {
                  position: absolute !important; top: 5px !important; right: 5px !important; z-index: 100 !important;
                  opacity: 0 !important; transition: opacity 0.2s ease !important;
                }
                .bili-video-card:hover .blacklist-button-container,
                .video-card:hover .blacklist-button-container,
                .feed-card:hover .blacklist-button-container {
                  opacity: 1 !important;
                }
                .blacklist-button-container .bilibili-blacklist-btn {
                  padding: 0px 4px !important; font-size: 10px !important;
                  min-width: unset !important; max-width: none !important; white-space: nowrap !important;
                  margin: 0 !important; /* 悬浮按钮不需要外边距 */
                }

                /* --- Toast 提示样式 (保持不变) --- */
                .bili-blacklist-toast { /* ... 省略不变的样式 ... */ }
                @keyframes toastIn { /* ... 省略不变的样式 ... */ }
                .bili-blacklist-toast-icon { /* ... 省略不变的样式 ... */ }
                .bili-blacklist-toast-content { /* ... 省略不变的样式 ... */ }
             `);
        }


        // Cookie获取函数 (保持不变)
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return '';
        }

        // 检查是否登录 (保持不变)
        const csrf = getCookie('bili_jct');
        if (!csrf) {
            log('警告: 未获取到bili_jct Cookie，可能未登录');
            showToast('B站拉黑脚本提示：请先登录B站账号！', 5000);
        } else {
            log('成功获取CSRF token');
        }

        // 菜单控制 (保持不变)
        const menuctl = ({ initValue = 0 }) => {
            let total = initValue;
            let menuId = null;
            const currentName = () => "去管理黑名单 --（ " + (total < 1 ? "请留意黑名单数量 ）" : `总共：${total} ）`);
            const register = () => {
                try {
                    menuId = GM_registerMenuCommand(currentName(), () => {
                        window.open('https://account.bilibili.com/account/blacklist', '_blank');
                    });
                    log('注册菜单成功: ', currentName());
                } catch (e) { log('注册菜单失败: ', e); }
            };
            register();
            const ctl = {
                get total() { return total; },
                set total(newValue) {
                    if (newValue == total) return;
                    if (menuId !== null) { try { GM_unregisterMenuCommand(menuId); log('解除注册旧菜单'); } catch (e) { log('解除注册旧菜单失败: ', e); } }
                    total = newValue;
                    register();
                },
            };
            return ctl;
        };
        const menu = menuctl({ initValue: 0 });

        // 显示自定义提示框 (保持不变)
        function showToast(message, duration = 3000) {
            $('.bili-blacklist-toast').remove();
            const toast = $(`<div class="bili-blacklist-toast"><span class="bili-blacklist-toast-icon">✓</span><div class="bili-blacklist-toast-content">${message}</div></div>`);
            $('body').append(toast);
            setTimeout(() => {
                toast.css({ 'opacity': '0', 'transform': 'translate(-50%, -20px)', 'transition': 'opacity 0.3s ease, transform 0.3s ease' });
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }


        // 拉黑功能 (保持不变)
        // === 更新后的 window.tools_toblack 函数 ===
        window.tools_toblack = (uid, upName) => {
            log('执行拉黑操作，UID:', uid, '名称:', upName);
            const isVideoPage = window.location.href.includes('/video/');

            // --- 辅助函数：更新按钮状态为“已拉黑” ---
            const setButtonToBlocked = (targetUid) => {
                log(`准备将 UID ${targetUid} 的按钮状态更新为 '已拉黑'`);
                let buttonUpdated = false;
                // 选择器：查找带有特定 data-uid 且尚未被禁用的按钮
                const selector = `.bilibili-blacklist-btn[data-uid="${targetUid}"]:not(:disabled)`;

                // 优先尝试视频页结构
                if (isVideoPage) {
                    $(`div.upname:not([data-block-updated="true"])`).each(function () {
                        const $upnameDiv = $(this);
                        const $link = $upnameDiv.find(`a[href*="/${targetUid}"]`);
                        if ($link.length > 0) {
                            const $button = $link.find(selector);
                            if ($button.length > 0) {
                                log('找到视频页按钮，更新为已拉黑:', $button[0]);
                                $button.text('已拉黑').css({ 'opacity': '0.6', 'cursor': 'not-allowed', 'background-color': '#eee', 'border-color': '#ddd', 'color': '#aaa' }).prop('disabled', true).off('click');
                                $upnameDiv.attr('data-block-updated', 'true');
                                buttonUpdated = true;
                                return false; // 停止搜索
                            }
                        }
                    });
                }

                // 如果视频页没找到，或者是在首页，进行通用查找
                if (!buttonUpdated) {
                    $(selector).each(function () {
                        const $button = $(this);
                        // 检查按钮是否可见，避免操作隐藏的按钮（虽然可能性小）
                        if ($button.is(':visible')) {
                            log('找到通用按钮，更新为已拉黑:', $button[0]);
                            $button.text('已拉黑').css({ 'opacity': '0.6', 'cursor': 'not-allowed', 'background-color': '#eee', 'border-color': '#ddd', 'color': '#aaa' }).prop('disabled', true).off('click');
                            buttonUpdated = true;
                            // 首页可能有多张卡片，不停止搜索
                        }
                    });
                }

                if (!buttonUpdated) {
                    log(`警告：未能找到 UID ${targetUid} 对应的按钮进行状态更新。`);
                }
            };
            // --- 辅助函数结束 ---


            // 执行 API 请求
            fetch("https://api.bilibili.com/x/relation/modify", {
                method: "POST", credentials: 'include', headers: { "Content-Type": "application/x-www-form-urlencoded", },
                body: new URLSearchParams({ 'fid': uid, 'act': 5, 're_src': 11, 'gaia_source': 'web_main', 'csrf': getCookie('bili_jct'), })
            }).then(res => {
                if (!res.ok) { throw new Error(`HTTP error! Status: ${res.status}`); } return res.json();
            }).then(data => {
                log('拉黑API响应:', data);
                if (data.code === 0) { // 拉黑成功
                    log('拉黑成功:', uid);
                    showToast(`已成功将 "${upName || 'UP主'}" 加入黑名单`);
                    setButtonToBlocked(uid); // 调用辅助函数更新按钮状态
                    if (!isVideoPage) { // 首页额外操作：移除卡片
                        log('执行首页移除操作...');
                        $(`.bili-video-card[data-up-id="${uid}"], .feed-card[data-up-id="${uid}"], .video-card[data-up-id="${uid}"]`).fadeOut(300, function () { $(this).remove(); });
                        $('div.uid_' + uid).fadeOut(300, function () { $(this).remove(); });
                    }
                } else { // 拉黑失败 (API返回错误码)
                    log('拉黑失败:', data.message || `错误码 ${data.code}`);

                    // === 新增：检查是否是 "已拉黑" 错误码 ===
                    if (data.code === 22120) {
                        log('检测到错误码 22120 (用户已被拉黑)');
                        showToast('该用户已被拉黑'); // 显示更具体的提示
                        setButtonToBlocked(uid); // 同样调用辅助函数更新按钮状态
                    } else {
                        // 对于其他所有错误，只显示通用失败提示，不改变按钮状态
                        showToast(`拉黑失败: ${data.message || `错误码 ${data.code}`}`);
                    }
                    // === 检查结束 ===
                }
            }).catch(err => { // 网络请求错误等
                log('拉黑请求错误:', err);
                showToast('拉黑请求失败，请检查网络或登录状态');
                // 网络错误不改变按钮状态
            });
            updateBlacklistCount(); // 更新黑名单计数
        };


        // 更新黑名单计数 (保持不变)
        function updateBlacklistCount() {
            fetch("https://api.bilibili.com/x/relation/blacks?re_version=0&pn=1&ps=20&jsonp=jsonp&web_location=333.33", {
                method: "GET", credentials: 'include',
            }).then(res => {
                if (!res.ok) { throw new Error(`HTTP error! Status: ${res.status}`); } return res.json();
            }).then(data => {
                log('黑名单API响应:', data); if (data.code === 0) { menu.total = data.data.total; log('更新黑名单计数:', data.data.total); }
                else { log('获取黑名单失败:', data.message || '未知错误'); }
            }).catch(err => { log('获取黑名单请求错误:', err); });
        }


        // === 处理首页 (已修改) ===
        function processHomePage() {
            log('处理首页');
            const possibleContainers = ['.bili-video-card', '.video-card', '.bili-video-card__wrap', '.feed-card'];
            let foundCards = false;

            possibleContainers.forEach(containerSelector => {
                const cards = $(`${containerSelector}:not([data-toblack-processed="true"])`);

                if (cards.length > 0) {
                    // log(`找到 ${cards.length} 个未处理的视频卡片 (${containerSelector})`); // 减少日志
                    foundCards = true;

                    cards.each((index, card) => {
                        const $card = $(card);
                        // 标记立即处理，避免重复
                        $card.attr('data-toblack-processed', 'true');

                        let ownerLinkElement = null;
                        let upName = '';
                        let ownerUrl = '';
                        let uid = '';

                        // 优先使用新结构选择器
                        ownerLinkElement = $card.find('a.bili-video-card__info--owner');
                        if (ownerLinkElement.length > 0) {
                            ownerUrl = ownerLinkElement.attr('href');
                            const authorSpan = ownerLinkElement.find('span.bili-video-card__info--author');
                            if (authorSpan.length > 0) {
                                upName = authorSpan.attr('title') || authorSpan.text().trim(); // 优先用 title
                            } else {
                                // 备选：直接取链接文本，尝试去除日期
                                upName = ownerLinkElement.text().trim().split('·')[0].trim();
                            }
                            log(`首页: 结构匹配成功 (a.bili-video-card__info--owner)`);
                        } else {
                            // Fallback 到旧的选择器逻辑
                            const possibleOwnerSelectors = ['.up-name', '.author-text', '.up-name__text'];
                            for (const selector of possibleOwnerSelectors) {
                                const element = $card.find(selector);
                                if (element.length > 0) {
                                    ownerLinkElement = element; // 记录找到的元素
                                    ownerUrl = element.attr('href');
                                    upName = element.text().trim();
                                    log(`首页: 备选结构匹配成功 (${selector})`);
                                    break;
                                }
                            }
                        }

                        if (!ownerUrl || !ownerLinkElement) {
                            // log('未能找到卡片上的UP主链接');
                            return; // Skip card
                        }

                        // 提取 UID
                        if (ownerUrl.includes('/space.bilibili.com/')) {
                            uid = ownerUrl.split('/space.bilibili.com/')[1].split('?')[0].split('/')[0];
                        } else if (ownerUrl.includes('/space/')) {
                            uid = ownerUrl.split('/space/')[1].split('?')[0].split('/')[0];
                        } else {
                            const match = ownerUrl.match(/\/(\d+)(\/|\?|$)/);
                            if (match && match[1]) { uid = match[1]; }
                        }

                        if (!uid || !/^\d+$/.test(uid)) {
                            // log('无法从URL提取有效的首页UID:', ownerUrl);
                            return; // Skip card
                        }

                        // 给卡片添加 data-up-id 属性，方便拉黑后移除
                        $card.attr('data-up-id', uid);

                        if (!upName) { upName = `UID: ${uid}`; } // Default name if extraction failed
                        log('提取首页UID:', uid, '名称:', upName);

                        // --- 按钮放置 ---
                        let buttonAdded = false;
                        // 尝试添加到 info--bottom 的前面 (首选)
                        const bottomInfoDiv = $card.find('.bili-video-card__info--bottom');
                        if (bottomInfoDiv.length > 0) {
                            if (bottomInfoDiv.find('.bilibili-blacklist-btn').length === 0) { // 避免重复添加
                                const blackButton = $(`<a class="bilibili-blacklist-btn" data-uid="${uid}">拉黑</a>`);
                                blackButton.on('click', function (e) { e.preventDefault(); e.stopPropagation(); window.tools_toblack(uid, upName); });
                                bottomInfoDiv.prepend(blackButton);
                                buttonAdded = true;
                                log('按钮添加到 info--bottom 前面');
                            } else { buttonAdded = true; /* Already exists */ }
                        }

                        // 备选：添加到卡片右上角悬浮 (如果上面没成功)
                        if (!buttonAdded && $card.find('.blacklist-button-container').length === 0) {
                            if (!$card.css('position') || $card.css('position') === 'static') {
                                $card.css('position', 'relative'); //确保卡片有定位上下文
                            }
                            const container = $('<div class="blacklist-button-container"></div>');
                            const blackButton = $(`<a class="bilibili-blacklist-btn" data-uid="${uid}">拉黑</a>`);
                            blackButton.on('click', function (e) { e.preventDefault(); e.stopPropagation(); window.tools_toblack(uid, upName); });
                            container.append(blackButton);
                            $card.append(container);
                            buttonAdded = true;
                            log('按钮添加到悬浮容器');
                        }

                        // 旧的 UID class 逻辑，保留
                        $card.addClass('uid_' + uid);
                    });
                }
            });
            // if (!foundCards) { log('本次未找到任何需要处理的视频卡片'); } // 减少日志
        }


        // === 处理视频页面 (保持不变, 使用 v1.0.7 的逻辑) ===
        function processVideoPage() {
            log('处理视频页面');

            function findAndProcessUpInfo() {
                // Target the container div first, ensure it's not already processed
                const upnameDivs = $('div.upname:not([data-toblack-processed="true"])');

                if (upnameDivs.length > 0) {
                    log(`找到 ${upnameDivs.length} 个未处理的视频页UP主容器 (div.upname)`);

                    upnameDivs.each(function () {
                        const upnameDiv = $(this);
                        // Find the main link (<a>) inside the div, which contains the space URL
                        const linkElement = upnameDiv.find('a[href*="/space.bilibili.com/"], a[href*="/space/"]');
                        // Find the name span (span.name) inside the link
                        const nameElement = linkElement.find('span.name');

                        if (linkElement.length > 0 && nameElement.length > 0) {
                            if (linkElement.find('.bilibili-blacklist-btn').length > 0) {
                                upnameDiv.attr('data-toblack-processed', 'true');
                                // log('按钮已存在于 upname link 中，跳过'); //减少日志
                                return;
                            }
                            const upUrl = linkElement.attr('href');
                            const upName = nameElement.text().trim();
                            if (!upUrl || !upName) { upnameDiv.attr('data-toblack-processed', 'true'); return; }
                            let uid = '';
                            if (upUrl.includes('/space.bilibili.com/')) { uid = upUrl.split('/space.bilibili.com/')[1].split('?')[0].split('/')[0]; }
                            else if (upUrl.includes('/space/')) { uid = upUrl.split('/space/')[1].split('?')[0].split('/')[0]; }
                            else { const match = upUrl.match(/\/(\d+)(\/|\?|$)/); if (match && match[1]) { uid = match[1]; } }
                            if (!uid || !/^\d+$/.test(uid)) { upnameDiv.attr('data-toblack-processed', 'true'); return; }
                            // ... (code to extract uid and upName) ...

                            log('提取视频页UID:', uid, '名称:', upName);
                            const blackButton = $(`<a class="bilibili-blacklist-btn" data-uid="${uid}">拉黑</a>`);

                            // === MODIFIED CLICK HANDLER for Video Page ===
                            blackButton.on('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[拉黑脚本] --- 视频页按钮点击事件触发 ---'); // Log: Handler Fired

                                const buttonElement = $(this);
                                // Re-read UID from the button's data attribute at the time of click
                                const clickedUid = buttonElement.data('uid');
                                // Use the name captured when the button was created (closure)
                                // Alternatively, could try finding the name span again relative to buttonElement if needed
                                const clickedName = upName;

                                console.log('[拉黑脚本] 点击时获取的 UID:', clickedUid, typeof clickedUid);
                                console.log('[拉黑脚本] 点击时获取的 Name:', clickedName);

                                // Validate the UID before calling the API function
                                if (!clickedUid || typeof clickedUid === 'undefined' || String(clickedUid).trim() === '' || !/^\d+$/.test(String(clickedUid))) {
                                    console.error('[拉黑脚本] 错误：点击时 UID 无效!', clickedUid);
                                    showToast('拉黑失败：无法获取有效的 UP 主 ID');
                                    // Optionally add more specific error messages based on the condition
                                    // if (!clickedUid) { showToast('拉黑失败：UID 未定义'); }
                                    // else if (!/^\d+$/.test(String(clickedUid))) { showToast('拉黑失败：UID 非数字'); }
                                    return; // Stop if UID is invalid
                                }

                                // If UID is valid, proceed to call the block function
                                console.log('[拉黑脚本] UID 有效，准备调用 tools_toblack...');
                                try {
                                    window.tools_toblack(String(clickedUid), clickedName);
                                } catch (apiError) {
                                    console.error('[拉黑脚本] 调用 tools_toblack 时出错:', apiError);
                                    showToast('拉黑操作内部出错，请检查控制台');
                                }
                            });
                            // === END MODIFIED CLICK HANDLER ===

                            nameElement.after(blackButton); // Insert button after the name span
                            upnameDiv.attr('data-toblack-processed', 'true');
                            log('已添加拉黑按钮到视频页UP主:', upName);
                        } else { upnameDiv.attr('data-toblack-processed', 'true'); }
                    });
                    return true; // Found and processed elements
                }
                return false; // Did not find any new div.upname to process this time
            }

            // Retry logic (保持不变)
            if (!findAndProcessUpInfo()) {
                // log('首次未找到UP主信息 (div.upname)，将在稍后重试'); // Reduce log noise
                let retryCount = 0; const maxRetries = 5; const retryInterval = 800;
                if (window.videoPageRetryTimer) { clearInterval(window.videoPageRetryTimer); }
                window.videoPageRetryTimer = setInterval(() => {
                    retryCount++;
                    if (findAndProcessUpInfo() || retryCount >= maxRetries) {
                        clearInterval(window.videoPageRetryTimer); window.videoPageRetryTimer = null;
                        if (retryCount >= maxRetries && !$('div.upname .bilibili-blacklist-btn').length) { log('在多次尝试后仍未找到或添加按钮到 UP主信息 (div.upname)'); }
                        else if ($('div.upname .bilibili-blacklist-btn').length > 0) { log(`通过重试找到并处理了 UP 主信息`); }
                    }
                }, retryInterval);
            }
        }


        // 统一处理入口 (保持不变)
        function processPage() {
            if (window.processingPage) { return; } // 简化跳过逻辑
            window.processingPage = true;
            try {
                const isVideoPage = window.location.href.includes('/video/');
                if (isVideoPage) { processVideoPage(); } else { processHomePage(); }
            } catch (error) {
                log("处理页面时出错:", error);
            } finally {
                // 使用 setTimeout 确保 processingPage 标志在稍后重置
                setTimeout(() => { window.processingPage = false; }, 300); // 减少延迟
            }
        }


        // === 设置DOM观察器 (已修改首页目标) ===
        function setupObserver() {
            if (window.blacklistObserverSet) { log('观察器已存在，跳过设置'); return; }
            log('设置DOM观察器');

            // --- (可选) Debounce 处理函数 ---
            // const debouncedProcessPage = debounce(processPage, 300);
            // ---

            const observer = new MutationObserver(function (mutations) {
                let needsUpdate = false;
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === 1) { needsUpdate = true; break; }
                        }
                    }
                    if (needsUpdate) return;
                });

                if (needsUpdate) {
                    // log('检测到DOM变更，计划更新拉黑按钮'); // 减少日志
                    // --- 使用 Debounce (可选) ---
                    // debouncedProcessPage();
                    // --- 不使用 Debounce ---
                    processPage();
                    // ---
                }
            });

            const isVideoPage = window.location.href.includes('/video/');
            let targetNode = null;

            if (isVideoPage) {
                // 视频页目标 (保持 v1.0.7 的选择)
                targetNode = document.querySelector('#viewbox_report') ||
                    document.querySelector('.video-info-detail') ||
                    document.querySelector('#app .left-container');
                log('尝试为视频页选择观察节点:', targetNode ? (targetNode.id || targetNode.className) : '未找到特定节点');
            } else {
                // 首页目标: 添加更多备选项
                targetNode = document.querySelector('#app .feed-list') || // 推荐流
                    document.querySelector('#i_cecream') ||      // 首页外层容器 ID 之一
                    document.querySelector('.bili-grid') ||      // 通用网格布局
                    document.querySelector('#app .bili-layout') || // 更通用的布局容器
                    document.querySelector('#app');              // 万不得已才用 #app
                log('尝试为首页选择观察节点:', targetNode ? (targetNode.id || targetNode.className) : '未找到特定节点');
            }

            if (targetNode) {
                log('最终选择观察节点:', targetNode);
                observer.observe(targetNode, { childList: true, subtree: true });
                window.blacklistObserverSet = true;
                log('DOM观察器已启动');
            } else {
                log('警告：未能找到合适的DOM节点进行观察，MutationObserver 未启动。按钮可能只在初始加载时添加。');
            }

            // 初始加载时检查 (总会执行一次)
            setTimeout(processPage, 1500);

            // 定期检查作为后备 (可选，可以注释掉)
            // if (window.blacklistInterval) clearInterval(window.blacklistInterval);
            // window.blacklistInterval = setInterval(processPage, 10000);
        }


        // 暴露给全局作用域 (保持不变)
        window.blacklistScript = { processPage, processHomePage, processVideoPage };

        // 启动逻辑 (保持不变)
        $(document).ready(function () {
            log('页面就绪，初始化脚本');
            setupObserver();
            updateBlacklistCount();
        });

        // 后备启动逻辑 (保持不变)
        setTimeout(function () {
            if (!window.blacklistObserverSet && !$('body').data('blacklist-init-fallback')) {
                log('延时后备初始化');
                $('body').data('blacklist-init-fallback', true);
                setupObserver();
                updateBlacklistCount();
                processPage();
            }
        }, 3000);

        log('脚本初始化完成');
    });
})();