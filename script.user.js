// ==UserScript==
// @name         B站首页和视频页一键拉黑UP主
// @description  在B站首页和视频页添加拉黑按钮，一键拉黑UP主。
// @match        https://bilibili.com/
// @match        https://www.bilibili.com/*
// @match        https://www.bilibili.com/video/*
// @match        https://bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @version      1.0.3
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addStyle
// @namespace    https://github.com/codertesla/bilibili-1-click-blocker
// @author       codertesla
// @supportURL   https://github.com/codertesla/bilibili-1-click-blocker/issues
// @homepageURL  https://github.com/codertesla/bilibili-1-click-blocker
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js
// @license      MIT
// @note         本脚本基于Greasy Fork脚本ID 526549进行改进和修复，原脚本存在运行问题，原脚本地址：https://greasyfork.org/zh-CN/scripts/526549-首页一键拉黑up主bilibili-com
// @updateURL    https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// @downloadURL  https://greasyfork.org/zh-CN/scripts/529390-b站首页和视频页一键拉黑up主
// @created      2024-03-10
// @updated      2024-03-10
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

    // 主函数
    waitForJQuery(function ($) {
        log('脚本初始化开始');

        // 添加样式
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(`
        .bilibili-blacklist-btn {
          color: #fb7299 !important;
          cursor: pointer !important;
          font-weight: normal !important;
          margin-right: 8px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1px 5px !important;
          border: 1px solid #fb7299 !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          transition: all 0.2s ease !important;
          background-color: white !important;
          box-shadow: 0 0 2px rgba(251, 114, 153, 0.2) !important;
          width: auto !important;
          min-width: unset !important;
          max-width: none !important;
          box-sizing: border-box !important;
          text-align: center !important;
          white-space: nowrap !important;
          /* 确保内容均匀分布 */
          gap: 1px !important;
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
          /* 移除或注释掉原有的 content 属性 */
          /* content: "\\e63c"; */
          font-family: "Arial" !important; /* 更改字体为常规字体，如果使用其他图标字体库则需要修改 */
          margin-right: 4px !important; /* 保持间隔 */
          font-size: 11px !important;
          display: inline-block !important;
          text-align: center !important;
        }
        /* 按钮动画效果 */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bilibili-blacklist-btn {
          animation: fadeIn 0.3s ease-out !important;
        }
        /* 优化视频页按钮样式 */
        .video-info-detail .bilibili-blacklist-btn {
          margin-left: 5px !important;
          vertical-align: middle !important;
          min-width: unset !important;
          max-width: none !important;
          font-size: 10px !important;
          padding: 0px 4px !important;
          white-space: nowrap !important;
        }
        .video-info-detail .bilibili-blacklist-btn::before {
          font-size: 10px !important;
          width: 10px !important;
        }
        /* 视频卡片上更紧凑的按钮样式 */
        .blacklist-button-container .bilibili-blacklist-btn {
          padding: 0px 4px !important;
          font-size: 10px !important;
          min-width: unset !important;
          max-width: none !important;
          white-space: nowrap !important;
        }
        .blacklist-button-container .bilibili-blacklist-btn::before {
          font-size: 10px !important;
          margin-right: 0 !important;
          width: 10px !important;
        }
        /* 在卡片上的悬浮样式 */
        .blacklist-button-container {
          position: absolute !important;
          top: 5px !important;
          right: 5px !important;
          z-index: 100 !important;
          opacity: 0 !important;
          transition: opacity 0.2s ease !important;
        }
        .bili-video-card:hover .blacklist-button-container,
        .video-card:hover .blacklist-button-container,
        .feed-card:hover .blacklist-button-container {
          opacity: 1 !important;
        }
        /* 自定义提示框样式 */
        .bili-blacklist-toast {
          position: fixed !important;
          top: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          color: white !important;
          padding: 10px 20px !important;
          border-radius: 4px !important;
          z-index: 9999 !important;
          font-size: 14px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
          display: flex !important;
          align-items: center !important;
          min-width: 200px !important;
          max-width: 80% !important;
          box-sizing: border-box !important;
          animation: toastIn 0.3s ease-out !important;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .bili-blacklist-toast-icon {
          color: #fb7299 !important;
          margin-right: 10px !important;
          font-size: 18px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .bili-blacklist-toast-content {
          flex-grow: 1 !important;
          display: flex !important;
          align-items: center !important;
        }
        /* 紧凑型按钮样式 */
        .bilibili-blacklist-btn-compact {
          padding: 0px 4px !important;
          font-size: 10px !important;
          min-width: unset !important;
          max-width: none !important;
          white-space: nowrap !important;
        }
        .bilibili-blacklist-btn-compact::before {
          font-size: 10px !important;
          margin-right: 0 !important;
          width: 10px !important;
        }
      `);
        }

        // Cookie获取函数
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return '';
        }

        // 检查是否登录
        const csrf = getCookie('bili_jct');
        if (!csrf) {
            log('警告: 未获取到bili_jct Cookie，可能未登录');
            showToast('B站拉黑脚本提示：请先登录B站账号！', 5000);
        } else {
            log('成功获取CSRF token');
        }

        // 菜单控制
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
                } catch (e) {
                    log('注册菜单失败: ', e);
                }
            };

            register();

            const ctl = {
                get total() { return total; },
                set total(newValue) {
                    if (newValue == total) return;
                    if (menuId !== null) {
                        try {
                            GM_unregisterMenuCommand(menuId);
                            log('解除注册旧菜单');
                        } catch (e) {
                            log('解除注册旧菜单失败: ', e);
                        }
                    }
                    total = newValue;
                    register();
                },
            };
            return ctl;
        };

        const menu = menuctl({ initValue: 0 });

        // 显示自定义提示框
        function showToast(message, duration = 3000) {
            // 移除已有的提示框
            $('.bili-blacklist-toast').remove();

            // 创建新的提示框
            const toast = $(`
                <div class="bili-blacklist-toast">
                    <span class="bili-blacklist-toast-icon">✓</span>
                    <div class="bili-blacklist-toast-content">${message}</div>
                </div>
            `);

            // 添加到页面
            $('body').append(toast);

            // 设置自动关闭
            setTimeout(() => {
                toast.css({
                    'opacity': '0',
                    'transform': 'translate(-50%, -20px)'
                });
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        // 拉黑功能
        window.tools_toblack = (uid, upName) => {
            log('执行拉黑操作，UID:', uid, '名称:', upName);

            // 用于视频页面的提示
            const isVideoPage = window.location.href.includes('/video/');

            fetch("https://api.bilibili.com/x/relation/modify", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    'fid': uid,
                    'act': 5,
                    're_src': 11,
                    'gaia_source': 'web_main',
                    'csrf': getCookie('bili_jct'),
                })
            }).then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            }).then(data => {
                log('拉黑API响应:', data);
                if (data.code === 0) {
                    log('拉黑成功:', uid);

                    // 在首页移除对应元素
                    if (!isVideoPage) {
                        $('div.uid_' + uid).each(function () {
                            log('移除元素:', this);
                            $(this).fadeOut(300, function () {
                                $(this).remove();
                            });
                        });
                        showToast(`已成功将 "${upName || 'UP主'}" 加入黑名单`);
                    } else {
                        // 在视频页面显示拉黑成功提示
                        showToast(`已成功将 "${upName || 'UP主'}" 加入黑名单`);
                    }

                } else {
                    log('拉黑失败:', data.message || '未知错误');
                    showToast(`拉黑失败: ${data.message || '未知错误'}`);
                }
            }).catch(err => {
                log('拉黑请求错误:', err);
                showToast('拉黑请求失败，可能是网络问题或未登录');
            });

            updateBlacklistCount();
        };

        // 更新黑名单计数
        function updateBlacklistCount() {
            fetch("https://api.bilibili.com/x/relation/blacks?re_version=0&pn=1&ps=20&jsonp=jsonp&web_location=333.33", {
                method: "GET",
                credentials: 'include',
            }).then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            }).then(data => {
                log('黑名单API响应:', data);
                if (data.code === 0) {
                    menu.total = data.data.total;
                    log('更新黑名单计数:', data.data.total);
                } else {
                    log('获取黑名单失败:', data.message || '未知错误');
                }
            }).catch(err => {
                log('获取黑名单请求错误:', err);
            });
        }

        // 处理首页
        function processHomePage() {
            log('处理首页');

            // 查找可能的视频卡片容器
            const possibleContainers = [
                '.bili-video-card',
                '.video-card',
                '.bili-video-card__wrap',
                '.feed-card'
            ];

            let found = false;

            possibleContainers.forEach(selector => {
                const cards = $(selector);
                if (cards.length > 0) {
                    log(`找到视频卡片 (${selector}):`, cards.length);
                    found = true;

                    cards.each((index, card) => {
                        // 检查是否已经处理过该卡片
                        if ($(card).data('toblack-processed') || $(card).find('.bilibili-blacklist-btn').length > 0) {
                            return;
                        }

                        // 尝试多种可能的UP主选择器
                        const possibleOwnerSelectors = [
                            '.bili-video-card__info--owner',
                            '.up-name',
                            '.bili-video-card__info--author',
                            '.author-text',
                            '.up-name__text'
                        ];

                        let ownerElement = null;
                        let ownerUrl = null;

                        for (const selector of possibleOwnerSelectors) {
                            const element = $(card).find(selector);
                            if (element.length > 0) {
                                ownerElement = element;
                                ownerUrl = element.attr('href');
                                log(`找到UP主元素 (${selector}):`, ownerUrl);
                                break;
                            }
                        }

                        if (!ownerUrl) {
                            $(card).data('toblack-processed', true);
                            return;
                        }

                        // 从URL中提取UID
                        let uid = '';
                        if (ownerUrl.includes('/space.bilibili.com/')) {
                            uid = ownerUrl.split('/space.bilibili.com/')[1].split('?')[0].split('/')[0];
                        } else if (ownerUrl.includes('/space/')) {
                            uid = ownerUrl.split('/space/')[1].split('?')[0].split('/')[0];
                        } else {
                            uid = ownerUrl.substr(ownerUrl.lastIndexOf('/') + 1).split('?')[0];
                        }

                        if (!uid) {
                            log('无法从URL提取UID:', ownerUrl);
                            return;
                        }

                        const upName = ownerElement.text().trim();
                        log('提取UID:', uid, '名称:', upName);

                        // 尝试找到适合放置按钮的位置
                        const possibleTargets = [
                            '.bili-video-card__info--bottom',
                            '.bili-video-card__info',
                            '.video-card__info',
                            '.info-bottom',
                            $(card) // 如果找不到特定元素，直接附加到卡片上
                        ];

                        let targetElement = null;

                        for (const target of possibleTargets) {
                            const element = typeof target === 'string' ? $(card).find(target) : target;
                            if (element.length > 0) {
                                targetElement = element;
                                break;
                            }
                        }

                        if (targetElement) {
                            // 创建按钮元素
                            const blackButton = $(`<a class="bilibili-blacklist-btn bilibili-blacklist-btn-compact" data-uid="${uid}">拉黑</a>`);
                            blackButton.on('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                window.tools_toblack(uid, upName);
                            });

                            // 插入按钮
                            if (targetElement === $(card)) {
                                // 如果是卡片本身，创建一个容器
                                const container = $('<div class="blacklist-button-container"></div>');
                                container.append(blackButton);
                                targetElement.css('position', 'relative').append(container);
                            } else {
                                // 常规情况，前置到目标元素
                                targetElement.prepend(blackButton);
                            }

                            $(card).data('toblack-processed', true).addClass('uid_' + uid);
                            log('已添加拉黑按钮到卡片:', index);
                        }
                    });
                }
            });

            if (!found) {
                log('未找到任何视频卡片，可能DOM结构已变更');
            }
        }

        // 处理视频页面
        function processVideoPage() {
            log('处理视频页面');

            // 查找UP主信息区域
            function findAndProcessUpInfo() {
                // 可能的UP主信息选择器 - 结合原有选择器和优化后的选择器
                const possibleUpSelectors = [
                    // 原有选择器(这些是有效的)
                    '.upname .name',
                    '.upname a',
                    '.up-name',
                    '.up-info_right',
                    '.up-info .name',
                    '.user-name',
                    '.username',
                    'a[href*="/space.bilibili.com/"]',
                    'a[href*="/space/"]',
                    // 更精确的选择器(作为补充)
                    '.up-info .upname .name',
                    '.up-info .upname a',
                    '.video-info-detail .up-info .name',
                    '.video-info-detail a[href*="/space.bilibili.com/"]'
                ];

                for (const selector of possibleUpSelectors) {
                    const upElements = $(selector);

                    if (upElements.length > 0) {
                        log(`找到视频页UP主元素 (${selector}):`, upElements.length);

                        upElements.each(function () {
                            const upElement = $(this);

                            // 如果已处理过，跳过
                            if (upElement.data('toblack-processed')) {
                                return;
                            }

                            // 获取UP主URL和名称
                            let upUrl = upElement.attr('href');
                            let upName = upElement.text().trim();

                            // 如果没有href属性(不是链接)，尝试查找父级或子级的链接
                            if (!upUrl) {
                                const parentLink = upElement.closest('a[href*="/space"]');
                                const childLink = upElement.find('a[href*="/space"]');

                                if (parentLink.length > 0) {
                                    upUrl = parentLink.attr('href');
                                    if (!upName) upName = parentLink.text().trim();
                                } else if (childLink.length > 0) {
                                    upUrl = childLink.attr('href');
                                    if (!upName) upName = childLink.text().trim();
                                }
                            }

                            if (!upUrl) {
                                log('未找到UP主链接');
                                return;
                            }

                            // 从URL中提取UID
                            let uid = '';
                            if (upUrl.includes('/space.bilibili.com/')) {
                                uid = upUrl.split('/space.bilibili.com/')[1].split('?')[0].split('/')[0];
                            } else if (upUrl.includes('/space/')) {
                                uid = upUrl.split('/space/')[1].split('?')[0].split('/')[0];
                            } else {
                                uid = upUrl.substr(upUrl.lastIndexOf('/') + 1).split('?')[0];
                            }

                            if (!uid) {
                                log('无法从URL提取UID:', upUrl);
                                return;
                            }

                            log('提取视频页UID:', uid, '名称:', upName);

                            // 创建拉黑按钮
                            const blackButton = $(`<a class="bilibili-blacklist-btn bilibili-blacklist-btn-compact" data-uid="${uid}">拉黑</a>`);
                            blackButton.on('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                window.tools_toblack(uid, upName);
                            });

                            // 添加按钮到UP主名称旁边
                            if (upElement.hasClass('name') && upElement.closest('.upname').length > 0) {
                                // 针对新的HTML结构特殊处理
                                const upnameDiv = upElement.closest('.upname');
                                // 将按钮添加到包含UP主名称的span后面
                                upElement.after(blackButton);
                            } else if (upElement.find('.name').length > 0) {
                                // 如果选中的是包含.name的元素
                                upElement.find('.name').after(blackButton);
                            } else {
                                upElement.after(blackButton);
                            }
                            upElement.data('toblack-processed', true);
                            log('已添加拉黑按钮到视频页UP主:', upName);
                        });

                        return true;
                    }
                }

                log('未找到视频页UP主信息');
                return false;
            }

            // 首次尝试
            if (!findAndProcessUpInfo()) {
                // 视频页面可能是动态加载的，需要多次重试
                log('未找到UP主信息，将在稍后重试');

                // 添加多次重试的逻辑
                let retryCount = 0;
                const maxRetries = 5;
                const retryInterval = 800; // 毫秒

                const retryTimer = setInterval(() => {
                    retryCount++;
                    log(`第${retryCount}次重试寻找UP主信息...`);

                    if (findAndProcessUpInfo() || retryCount >= maxRetries) {
                        clearInterval(retryTimer);
                        if (retryCount >= maxRetries && !findAndProcessUpInfo()) {
                            log('在多次尝试后仍未找到UP主信息');
                        }
                    }
                }, retryInterval);
            }
        }

        // 统一处理入口
        function processPage() {
            // 添加节流，避免频繁处理
            if (window.processingPage) {
                log('页面正在处理中，跳过');
                return;
            }

            window.processingPage = true;
            setTimeout(() => { window.processingPage = false; }, 1000);

            const isVideoPage = window.location.href.includes('/video/');

            if (isVideoPage) {
                log('检测到视频页面');
                processVideoPage();
            } else {
                log('检测到首页');
                processHomePage();
            }
        }

        // 设置DOM观察器
        function setupObserver() {
            // 如果已经设置了观察器，则不重复设置
            if (window.blacklistObserverSet) {
                log('观察器已存在，跳过设置');
                return;
            }

            log('设置DOM观察器');

            const observer = new MutationObserver(function (mutations) {
                let needsUpdate = false;

                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        needsUpdate = true;
                    }
                });

                if (needsUpdate) {
                    log('检测到DOM变更，更新拉黑按钮');
                    processPage();
                }
            });

            // 观察主要内容区域而不是整个body
            const isVideoPage = window.location.href.includes('/video/');
            let targetNode;

            if (isVideoPage) {
                // 视频页面选择主要内容区域，但避开导航栏
                targetNode = document.querySelector('#app #viewbox_report') || // UP主信息通常在这里
                    document.querySelector('#app .video-info-box') ||
                    document.querySelector('#app .video-info-detail') ||
                    document.querySelector('#app .video-container-v1') ||
                    document.querySelector('#bilibiliPlayer') ||
                    document.body; // 如果以上都不存在，则降级为body
            } else {
                // 首页选择主要内容区域
                targetNode = document.querySelector('#app .bili-layout-main') ||
                    document.querySelector('#app .bili-grid') ||
                    document.querySelector('#app .feed-card') ||
                    document.body; // 如果以上都不存在，则降级为body
            }

            log('选择观察节点:', targetNode);

            observer.observe(targetNode, {
                childList: true,
                subtree: true
            });

            // 标记观察器已设置
            window.blacklistObserverSet = true;

            log('DOM观察器已启动');

            // 初始加载时检查
            setTimeout(processPage, 1000);

            // 页面可能是动态加载的，定期检查，但减少频率
            window.blacklistInterval = setInterval(processPage, 5000);
        }

        // 暴露给全局作用域，方便调试
        window.blacklistScript = {
            processPage: processPage,
            processHomePage: processHomePage,
            processVideoPage: processVideoPage
        };

        // 在页面就绪后启动
        $(document).ready(function () {
            log('页面就绪，初始化脚本');
            setupObserver();
            updateBlacklistCount();
        });

        // 额外的保障，防止document.ready不触发
        setTimeout(function () {
            log('延时检查初始化');
            if (!$._data(document, 'events') || !$._data(document, 'events').ready) {
                log('未检测到document.ready事件，手动初始化');
                setupObserver();
                updateBlacklistCount();
            }
        }, 2000);

        log('脚本初始化完成');
    });
})();