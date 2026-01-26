# 🚫 Bilibili 1-Click Blocker (B站一键拉黑)

[![安装脚本](https://img.shields.io/badge/安装脚本-Greasy%20Fork-red.svg?style=for-the-badge&logo=tampermonkey)](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)
[![GitHub](https://img.shields.io/badge/GitHub-仓库-blue.svg?style=for-the-badge&logo=github)](https://github.com/codertesla/bilibili-1-click-blocker)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/codertesla/bilibili-1-click-blocker/blob/main/LICENSE)

为哔哩哔哩（Bilibili）设计的极简、高效的一键拉黑工具。彻底杜绝不想看到的 UP 主，还你一个清爽的冲浪环境。

---

## ✨ 核心特性

- **🚀 一键瞬移拉黑**：
  - **首页推荐**：在 UP 主名称旁直观显示“拉黑”按钮，点击即消失。
  - **视频详情页**：观看时发现不适？直接在视频页一键封禁。
  - **搜索结果页**：搜索场景同步支持，全方位覆盖。
- **🧹 纯净模式**：
  - **自动屏蔽广告**：默认开启，自动剔除首页推广卡片，并智能识别屏蔽视频播放页右上角的广告内容。
  - **可选隐藏直播**：不喜欢在首页看直播？菜单一键开启隐藏，专注视频内容。
- **📋 智能管理**：
  - 直接对接 **B站官方黑名单**，操作即刻生效，黑名单上限由 B站账号等级决定。
  - **操作回馈**：友好的 Toast 提示，拉黑成功一目了然。

---

## 🛠️ 安装指南

1. **安装脚本管理器**：
   - [Tampermonkey](https://www.tampermonkey.net/) (推荐)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. **点此一键安装**：
   - 👉 [**安装 B站一键拉黑脚本**](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)
3. **刷新 页面** 即可立即生效。

---

## 📸 效果展示

| 首页拉黑 (原生) | 视频详情页拉黑 |
| :--- | :--- |
| ![首页示例](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/homepage.avif) | ![视频页示例](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/videopage.avif) |

---

## ⚙️ 菜单配置

点击浏览器右上角的油猴插件图标，在本脚本的菜单中你可以：
- **去管理黑名单**：查看已拉黑人数，跳转官网管理。
- **首页隐藏直播卡片**：开启/关闭首页直播内容显示。
- **屏蔽首页广告卡片**：开启/关闭推荐页的商业广告屏蔽。

> [!TIP]
> 觉得首页还是太乱？尝试打开脚本的 **隐藏直播卡片** 和 **屏蔽广告卡片** 功能，还你一个清爽的首页！

---

## ⚠️ 注意事项

> [!IMPORTANT]
> - **必须登录**：脚本调用的是B站官方 API，未登录状态下无法执行拉黑操作。
> - **账号级封禁**：拉黑操作是账号维度的，同步生效于移动端 App 和其他终端。
> - **缓存说明**：拉黑后视频卡片会立即从当前页面移除，但 B站的推荐算法可能有几分钟延迟，刷新页面即可看到最终效果。

> [!CAUTION]
> **关于 BewlyBewly 插件**：本脚本**不兼容** [BewlyBewly](https://github.com/BewlyBewly/BewlyBewly) 插件。由于 BewlyBewly 对 B 站页面进行了大量 DOM 结构修改，适配难度较高，且开发者本地环境无法正常运行 BewlyBewly 进行测试，故已放弃适配。如果你正在使用 BewlyBewly，本脚本可能无法正常工作，敬请谅解。

---

## ❓ 常见问题

<details>
<summary><b>Q: 拉黑后多久生效？</b></summary>
A: API 操作是即时的。脚本会自动移除当前页面的相关卡片。如果刷新后依然看到，通常是 B站服务端的缓存，稍等片刻即可。
</details>

<details>
<summary><b>Q: 如何取消拉黑？</b></summary>
A: 在脚本菜单点击“去管理黑名单”，或者直接访问 B站官方 [黑名单管理页面](https://account.bilibili.com/account/blacklist)。
</details>

<details>
<summary><b>Q: 为什么有些广告屏蔽不了？</b></summary>
A: 脚本通过匹配“广告”标识来屏蔽。对于某些绕过标识的特殊推广，欢迎反馈，我们会持续更新过滤规则。
</details>

---

## 📜 更新日志

- **v1.2.5** (2026-01-26)：移除 BewlyBewly 适配功能（因适配难度大且无法测试，故放弃适配）。
- **v1.2.4** (2026-01-25)：优化拉黑按钮配色，改为低调灰色系；新增 B 站亮/暗主题自适应支持（使用 `html.night-mode` 检测）。
- **v1.2.3** (2026-01-15)：增强广告屏蔽能力，新增**屏蔽视频播放页右上角广告卡片**功能。
- **v1.2.2** (2026-01-11)：新增**屏蔽首页广告卡片**功能，默认开启，回归纯净推荐。
- **v1.2.1** (2026-01-05)：新增**首页隐藏直播卡片**功能，支持菜单动态开关。
- **v1.1.4** (2025-03-11)：新增对 **B站搜索结果页面** 的支持。
- **v1.0.0** (2025-03-10)：初始版本发布，核心拉黑功能实现。

---

## 🤝 贡献与反馈

- **提交 BUG / 建议**：[GitHub Issues](https://github.com/codertesla/bilibili-1-click-blocker/issues) 或 [Greasy Fork 反馈区](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主/feedback)
- **致谢**：项目灵感源自 Greasy Fork 脚本 ID 526549，在此基础上进行了大量的修复与功能扩展。

---

**免责声明**：本脚本仅供学习和个人使用。使用本脚本产生的任何后果由用户自行承担。

[![Star History Chart](https://api.star-history.com/svg?repos=codertesla/bilibili-1-click-blocker&type=Date)](https://star-history.com/#codertesla/bilibili-1-click-blocker&Date)