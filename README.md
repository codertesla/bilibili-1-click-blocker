# 油猴脚本:B站一键拉黑UP主

[![安装脚本](https://img.shields.io/badge/安装脚本-Greasy%20Fork-red.svg)](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)
[![GitHub](https://img.shields.io/badge/GitHub-仓库-blue.svg)](https://github.com/codertesla/bilibili-1-click-blocker)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/codertesla/bilibili-1-click-blocker/blob/main/LICENSE)

## 功能介绍

这是一个为B站（哔哩哔哩）用户设计的实用工具，可以帮助你快速管理不想看到的UP主内容。

### 主要功能

- **首页一键拉黑**：在首页推荐视频的UP主名称旁添加拉黑按钮，点击即可将该UP主加入黑名单
- **视频页一键拉黑**：在视频页面添加拉黑按钮，可以直接拉黑当前视频的UP主
- **隐藏直播卡片**：可选功能，开启后首页不再显示直播推荐卡片（默认关闭）
- **屏蔽广告卡片**：自动识别并屏蔽首页的广告推广卡片（默认开启）
- **黑名单管理**：通过脚本菜单可以查看和管理已拉黑的UP主列表
- **拉黑提示**：操作成功后会显示友好的提示信息
- **自动过滤**：拉黑后B站将不再在首页推荐该UP主的内容
- **兼容性强**：支持B站**搜索结果页面**，并对第三方美化主题（如 **BewlyBewly**）进行深度适配。

### 兼容性
> [!NOTE]
> 本脚本致力于兼容B站的各种使用环境，已对流行的 **BewlyBewly** 主题进行深度适配，解决了在 **Shadow DOM** 环境下的按钮样式丢失和点击无响应等问题。
>
> 如果您在使用其他主题时遇到兼容性问题，欢迎通过 [GitHub Issues](https://github.com/codertesla/bilibili-1-click-blocker/issues) 向我们反馈。

## 安装方法

1. 首先安装用户脚本管理器（如果已安装请跳过）：
   - [Tampermonkey](https://www.tampermonkey.net/)（推荐，支持Chrome、Edge、Firefox等主流浏览器）
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)（仅Firefox）

2. 点击下面的安装链接安装脚本：
   - [点击此处安装脚本](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主)

3. 在弹出的安装页面中点击"安装"或"确认安装"按钮

4. 安装完成后，刷新B站页面即可使用

## 使用方法

### 安装后即可使用，无需额外设置

1. **首页拉黑**：
   - 浏览B站首页时，每个视频卡片的UP主名称前会出现一个"拉黑"按钮
   - 点击该按钮即可将对应UP主加入黑名单

2. **视频页拉黑**：
   - 观看视频时，在UP主信息区域会出现"拉黑"按钮
   - 点击该按钮即可将当前视频的UP主加入黑名单

3. **管理黑名单**：
   - 点击浏览器油猴扩展图标
   - 在脚本菜单中选择"去管理黑名单"
   - 可以查看已拉黑UP主数量和列表
   - 支持从黑名单中移除UP主

4. **隐藏直播卡片**（可选）：
   - 点击浏览器油猴扩展图标 -> 脚本菜单 -> "首页隐藏直播卡片"
   - 开启后，首页将不显示直播推荐卡片（设置自动保存）

5. **屏蔽广告卡片**（可选）：
   - 脚本默认会自动屏蔽带有"广告"标签的推广卡片
   - 菜单路径：浏览器油猴扩展图标 -> 脚本菜单 -> "屏蔽首页广告卡片"

> [!TIP]
> 觉得首页还是太乱？尝试配合脚本的 **隐藏直播卡片** 和 **屏蔽广告卡片** 功能，还你一个清爽的首页！

## 效果预览

首页拉黑效果

![首页拉黑效果](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/homepage.avif)

视频页拉黑效果

![视频页拉黑效果](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/videopage.avif)

BewlyBewly首页拉黑效果

![BewlyBewly首页拉黑效果](https://raw.githubusercontent.com/codertesla/bilibili-1-click-blocker/main/screenshots/BewlyBewly.avif)

## 注意事项

> [!IMPORTANT]
> - 本脚本使用B站官方的拉黑 API，**必须登录B站账号** 才能正常使用。
> - 拉黑操作是 **账号级别** 的，会同步影响你在 App 端和其他设备上的浏览体验。
> - 拉黑后，该UP主的内容不再出现在首页推荐，但仍可通过搜索或直接访问其空间查看。

> [!WARNING]
> 如果发现某些页面拉黑按钮未显示，通常刷新一下页面即可解决（可能是因为网络延迟或 B 站页面懒加载导致的 DOM 变化）。

## 常见问题

<details>
<summary><strong>Q: 拉黑后多久生效？</strong></summary>
A: 拉黑操作通常立即生效，但B站首页推荐流可能有缓存。建议操作成功后，手动刷新一次页面查看效果。
</details>

<details>
<summary><strong>Q: 如何查看已拉黑的UP主？</strong></summary>
A: 点击油猴扩展图标，在本脚本的菜单中选择"去管理黑名单"，即可跳转到B站官方的黑名单管理页面。
</details>

<details>
<summary><strong>Q: 不小心拉黑了想要取消怎么办？</strong></summary>
A: 在黑名单管理页面可以找到误拉黑的UP主，点击移除即可。
</details>

<details>
<summary><strong>Q: 为什么有些UP主拉黑后仍然出现在推荐中？</strong></summary>
A: 
1. B站推荐系统有较长的缓存时间，请尝试刷新页面。
2. 某些商业推广内容（广告）可能不受普通拉黑限制，建议开启脚本的 <b>屏蔽广告卡片</b> 功能。
</details>

<details>
<summary><strong>Q: 使用了其他美化脚本/主题，按钮不显示？</strong></summary>
A: 本脚本深度适配了 <code>BewlyBewly</code>。如果是其他主题，请在 GitHub Issue 反馈，我们会尝试适配。
</details>

## 更新日志

- v1.2.2 (2026-01-11)：新增**屏蔽首页广告卡片**功能，默认开启，自动过滤含有"广告"标记的推广内容。
- v1.2.1 (2026-01-05)：新增**首页隐藏直播卡片**功能，可通过脚本菜单开关，隐藏首页的直播推荐卡片。
- v1.1.8 (2025-07-08)：深度适配第三方主题 **BewlyBewly**，通过处理 **Shadow DOM**，彻底解决了在该主题下按钮样式丢失、点击后无响应的问题。
- v1.1.4 (2025-03-11)：新增对 **B站搜索结果页面** 的支持，并为适配 `BewlyBewly` 主题进行初步探索和重构。
- v1.1.2 (2025-03-11)：修复B站首页改版后按钮无法显示的问题，优化按钮插入逻辑。
- v1.0.1 (2025-03-10)：修复了部分页面拉黑按钮不显示的问题
- v1.0.0 (2025-03-10)：首次发布，实现基本功能

## 反馈与支持

如有使用问题或功能建议，请通过以下方式联系：
- [在GitHub提交Issue](https://github.com/codertesla/bilibili-1-click-blocker/issues)
- [在Greasy Fork脚本页面留言](https://greasyfork.org/zh-CN/scripts/529390-B站首页和视频页一键拉黑UP主/feedback)

## 开发与贡献

欢迎对本项目提出改进建议或贡献代码：

1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

## 致谢

本脚本基于 Greasy Fork 脚本ID 526549进行改进和修复，感谢原作者的创意和贡献。由于原脚本存在一些运行问题，本脚本进行了修复和功能增强。

原脚本地址：[首页一键拉黑up主bilibili.com](https://greasyfork.org/zh-CN/scripts/526549-首页一键拉黑up主bilibili-com)

## 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](https://github.com/codertesla/bilibili-1-click-blocker/blob/main/LICENSE) 文件

---

**免责声明**：本脚本仅供学习和个人使用，请勿用于任何商业用途。使用本脚本产生的任何后果由用户自行承担。