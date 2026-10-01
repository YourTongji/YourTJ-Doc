# 持久化存储

移动端的本地持久化分四个互不共享数据的 store：话题与私信的通用离线缓存、校园快照、本机写作、凭据。下文 `lib/` 开头的路径都相对 `apps/mobile/packages/forum_app/`。

| Store | 管什么 | 位置 |
| --- | --- | --- |
| `AppDatabase`（drift） | 已浏览话题与 IM 会话的离线副本 | `lib/src/offline/drift_cache.dart` |
| `CampusSnapshotStore` | 校园 profile / calendar / timetable / today 快照 | `lib/src/offline/campus_snapshot_store.dart` |
| `WritingStore` | 本机草稿与最近搜索 | `lib/src/local/writing_store.dart` |
| `SecureTokenStorage` | 论坛 token 与轻量会话元数据 | `apps/mobile/packages/auth/lib/src/secure_token_storage.dart` |

## 总原则

- **按账号隔离**：所有设备本地数据都命名空间化到 API origin + 数字账号 ID；访客历史用 ID 0，草稿功能要求登录。切换账号后，旧账号的数据不能进入新账号的上下文。
- **撤销优先于回退**：服务端拒绝、删除或撤销对某资源的访问时，必须让屏幕上的快照和磁盘副本同时失效，而不是回退展示旧副本；401 额外触发全局会话失效。
- **凭据不走普通存储**：token 只进系统安全存储（flutter_secure_storage，iOS Keychain / Android Keystore），各业务 store 里都不保存凭据。

## 通用离线缓存

`AppDatabase` 是一个 drift 数据库，按 `CacheCategory`（forum / chat / campus / media）划分数据类别。每个类别有独立的暂停开关和清理代际：用户清除某类缓存或会话失效时，只挂起对应类别，不牵连其他类别的在途请求。

数据库有 64 MiB 的物理预算（`physicalBudgetBytes`），写入后通过 `maintainBudget` 回收超额空间，回收阈值为 4 MiB。

话题和私信的离线副本遵循同一条服务边界：服务端明确拒绝或删除的内容，离线副本必须同步失效；私信缓存与话题缓存共享一套协调清理流程（登出、401、重新登录时执行）。

## 校园快照

唯一落盘的校园数据是校园快照，由 `CampusSnapshotStore` 用 drift 在同一个 `AppDatabase` 里维护一张 `campus_snapshots` 表：

- 每行对应一个缓存作用域（`site + account_id`），行内记录 `binding_revision` 和 schema 版本；最多保留 4 个作用域，超出时按提交时间淘汰最旧的。
- profile、calendar、timetable、today 四个白名单数据集各占 payload 里一个键，状态只能是 ready 或 empty；整份快照序列化成一份 JSON，在事务内用单条 `INSERT OR REPLACE` 写入，读者不会看到刷新到一半的数据。
- `binding_revision` 是服务端 `/api/campus` 返回的校园身份绑定版本号。复用快照前必须与当前绑定版本一致，重新绑定或换绑学号后旧快照整体作废，防止上一份课表和资料串给新绑定。
- 读取时校验 schema 版本、大小（上限 1 MiB）和时效（30 天，容忍 5 分钟时钟偏差），任何一项不过就删除该行、按无缓存处理。
- 写入走串行队列并带代际标记：缓存 epoch 变化或校园缓存被清除后，仍在队列里的旧写入会抛 `CampusSnapshotSuperseded` 作废，不会盖住新会话的数据。
- 消息摘要和正文刻意不序列化——payload 里的 `messages` 恒为空数组，凭据和非白名单数据集进不了这个 store。

桌面小组件消费的课表投影就派生自这份快照，细节见[桌面小组件](/development/mobile/widgets)。

## 本机写作

`WritingStore` 按 API origin 与数字账号 ID 隔离未完成草稿和最近搜索，token 永远不进这个 store。每次新建写作会话使用独立 ID，不与其他会话共用内容槽位；云端草稿编辑、已发布话题编辑和按话题保存的回复分别命名。旧 v1 存储前缀保持可读，元数据只增不改，已有的恢复副本不会丢失。

行为细节（保留哪些内容、失败重试、撤销等）见 forum_app README 的"本机写作"一节。

## 凭据

`SecureTokenStorage` 基于 flutter_secure_storage 实现，落在 iOS Keychain / Android Keystore，保存论坛 token 和轻量的登录用户信息（供论坛 UI 展示）。聊天 outbox 的图片发送意图（用于 App 终止后恢复重试项）同样写入账号级安全存储，恢复出来的是显式重试项，不会自动重发网络请求。
