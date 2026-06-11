# Bilibili 1-Click Blocker

[![安装脚本](https://img.shields.io/greasyfork/v/529390?style=for-the-badge&label=%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC&logo=tampermonkey&color=red)](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)
[![GitHub](https://img.shields.io/badge/GitHub-仓库-blue.svg?style=for-the-badge&logo=github)](https://github.com/codertesla/bilibili-1-click-blocker)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/codertesla/bilibili-1-click-blocker/blob/main/LICENSE)

B 站一键拉黑 UP 主脚本。把“拉黑”按钮放到首页推荐、搜索结果、视频详情页以及视频页右上角 UP 主信息区域，点击后调用 B 站官方黑名单接口，并立即移除当前页面里的相关视频卡片。

## 功能

- 一键拉黑 UP 主：支持首页推荐、搜索结果、视频详情页作者区、视频详情页右上角 UP 主信息区。
- 即时清理页面：拉黑成功后自动移除当前页面中同一 UP 主的视频卡片。
- 广告过滤：默认屏蔽首页广告卡片，并过滤视频播放页右上角广告内容。
- 首页隐藏直播：可在油猴菜单中开启或关闭。
- 官方黑名单同步：直接写入 B 站账号黑名单，移动端和其他终端同步生效。
- 亮色/暗色主题适配：按钮样式会跟随 B 站主题显示。

## 安装

1. 安装脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。
2. 打开 Greasy Fork 页面安装脚本：[B站一键拉黑UP主](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)。
3. 刷新 B 站页面后生效。

## 效果展示

| 首页拉黑 | 视频详情页拉黑 |
| :--- | :--- |
| ![首页拉黑示例](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/homepage.avif) | ![视频详情页拉黑示例](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/videopage.avif) |

## 菜单配置

点击浏览器右上角的油猴插件图标，在本脚本菜单中可以使用：

- 去管理黑名单：查看已拉黑人数，并跳转到 B 站官方黑名单管理页。
- 首页隐藏直播卡片：开启或关闭首页直播内容隐藏。
- 屏蔽首页广告卡片：开启或关闭推荐页商业广告过滤。

## 注意事项

- 必须登录 B 站账号。脚本调用 B 站官方接口，未登录或登录过期时无法拉黑。
- 拉黑是账号维度操作，会同步影响移动端 App 和其他终端。
- 当前页面的视频卡片会立即移除，但 B 站推荐缓存可能有延迟；刷新页面或稍等片刻即可。
- 本脚本不兼容 [BewlyBewly](https://github.com/BewlyBewly/BewlyBewly)。该插件大幅修改 B 站 DOM 结构，适配和测试成本较高，当前不再维护兼容逻辑。

## 常见问题

<details>
<summary><b>拉黑后多久生效？</b></summary>

API 操作即时生效。脚本会立即清理当前页面中可识别的相关卡片；如果刷新后仍然看到，通常是 B 站服务端推荐缓存延迟。
</details>

<details>
<summary><b>如何取消拉黑？</b></summary>

在脚本菜单点击“去管理黑名单”，或直接访问 B 站官方 [黑名单管理页面](https://account.bilibili.com/account/blacklist)。
</details>

<details>
<summary><b>为什么有些广告没有被屏蔽？</b></summary>

脚本主要通过广告标识和常见广告容器识别推广内容。若 B 站更换结构或隐藏标识，可能需要更新规则。
</details>

## 更新日志

- v1.3.7 (2026-06-11)：修复已拉黑 UP 主页面刷新后按钮状态错误及浮层定位问题；Profile 和推荐列表按钮不再修改 B 站组件内部 DOM。已拉黑页面的推荐封面仍可能受 B 站自身加载逻辑影响。
- v1.3.6 (2026-06-11)：修复视频页右上角 UP 主信息按钮与 ACG 助手等插件的 DOM 渲染冲突；按钮改为独立浮层，并新增菜单开关。
- v1.3.5 (2026-06-05)：更新 README 和效果截图，补充视频页右上角 UP 主信息区的一键拉黑说明。
- v1.3.4 (2026-06-03)：修复初始化阶段过早修改 B 站 DOM，导致评论、推荐视频封面和列表链接等异步内容载入异常的问题。
- v1.3.3 (2026-05-30)：优化初始化处理时机，页面已有内容会立即处理，并保留延迟兜底以兼容 B 站异步渲染。
- v1.3.1 (2026-05-30)：适配新版视频页右上角 UP 主信息面板，在 UP 主名称右侧新增一键拉黑按钮。
- v1.2.5 (2026-01-26)：移除 BewlyBewly 适配功能。
- v1.2.4 (2026-01-25)：优化拉黑按钮配色，新增 B 站亮/暗主题自适应支持。
- v1.2.3 (2026-01-15)：增强广告屏蔽能力，新增视频播放页右上角广告卡片屏蔽功能。
- v1.2.2 (2026-01-11)：新增屏蔽首页广告卡片功能，默认开启。
- v1.2.1 (2026-01-05)：新增首页隐藏直播卡片功能，支持菜单动态开关。
- v1.1.4 (2025-03-11)：新增对 B 站搜索结果页的支持。
- v1.0.0 (2025-03-10)：初始版本发布。

## 反馈

- GitHub Issues：[提交 BUG 或建议](https://github.com/codertesla/bilibili-1-click-blocker/issues)
- Greasy Fork：[反馈区](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主/feedback)

项目灵感源自 Greasy Fork 脚本 ID 526549，并在此基础上进行了修复与功能扩展。

**免责声明**：本脚本仅供学习和个人使用。使用本脚本产生的任何后果由用户自行承担。

[![Star History Chart](https://api.star-history.com/svg?repos=codertesla/bilibili-1-click-blocker&type=Date)](https://star-history.com/#codertesla/bilibili-1-click-blocker&Date)
