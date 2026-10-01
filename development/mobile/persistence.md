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

`AppDatabase` 是一个 drift 数据库，按 `CacheCategory`（forum / chat / campus / media）划分数据类别。每个类别有独立的挂起开关和清理代际。挂起由 `CacheCoordinator` 在清理时设置：用户清除某类缓存时，先 `suspend` 该类别（同时递增它的清理代际、作废在途工作），清库完成后 `release` 恢复。挂起期间，该类别的读写在入口处直接失败，而不是排队到清理结束后执行；其他类别的在途请求不受影响。对校园快照来说，这个窗口期内的写入表现为抛 `CampusSnapshotSuperseded`。

数据库有 64 MiB 的物理预算（`physicalBudgetBytes`），写入后通过 `maintainBudget` 回收超额空间，回收阈值为 4 MiB。

话题和私信的离线副本遵循同一条服务边界：服务端明确拒绝或删除的内容，离线副本必须同步失效；私信缓存与话题缓存共享一套协调清理流程（登出、401、重新登录时执行）。

## 校园快照

唯一落盘的校园数据是校园快照。`CampusSnapshotStore`（`lib/src/offline/campus_snapshot_store.dart`）用 drift 在共享的 `AppDatabase` 里维护一张 `campus_snapshots` 表，每行对应一个作用域（`site + account_id`）；payload 是 profile、calendar、timetable、today 四个白名单数据集组成的单份 JSON——分别对应校园个人资料、校历、学期课表和今日教学日（含当天课程），在事务内用单条 `INSERT OR REPLACE` 原子替换。所有实例方法都经 `_serialize` 进入同一个串行队列，互斥与作废机制见[内部机制](#内部机制)。

### 构造

`CampusSnapshotStore(AppDatabase _db, {DateTime Function()? now})`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `_db` | `AppDatabase` | 共享的 drift 数据库实例，`campus_snapshots` 表建在其中；campus 类别被挂起时（`_db.available(CacheCategory.campus)` 为假），读写都会直接失败 |
| `now` | `DateTime Function()?`，命名可选 | 取当前时间的函数，默认 `DateTime.now`；测试注入固定时钟，让 30 天时效、时钟偏差这些时间判断可复现 |

### 常量

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `schemaVersion` | `1` | 快照行的 schema 版本，写入时随行记录；读取时不匹配即视为损坏，删除该行、按无缓存处理 |
| `maxAge` | 30 天 | 快照时效：`committedAt` 距今超过 30 天的行在读取时作废；未来时间最多容忍 5 分钟时钟偏差 |
| `maxBytes` | 1 MiB | 单份 payload 的 UTF-8 字节上限：写入超限抛 `StateError`，读取超限按损坏处理 |
| `maxScopes` | `4` | 表中最多保留的作用域行数；每次写入后在同一事务里按 `committed_at` 从新到旧保留 4 行，其余删除 |

### 白名单数据集

`campusPersistentKeys` 是同文件里定义的常量集合，列出允许进入快照表的全部数据类别：

| 键 | 内容 |
| --- | --- |
| `profile` | 校园个人资料，展示用的指标和字段 |
| `calendar` | 校历，含"教学周"等指标；投影推算八天滚动窗口时用它定位日期 |
| `timetable` | 学期课表，`events` 数组每条含课程名、教师、教室、校区、星期、节次、周次和学分 |
| `today` | 今日教学日：`teachingDay`（日期、调课类型、调课标签、节次数）加当天课程 |

写入和读取两侧都按这个集合校验：传入的 data 必须恰好包含这四个键，每个数据集自身的 `key` 字段要与键名一致、状态只能是 ready 或 empty；多一个、少一个或键名不符都会被拒绝。校园接口返回的其他数据（成绩明细、消息等）因此结构上进不了 store，而不只是"代码目前没存"。

### 实例方法

#### read

```dart
Future<CampusSnapshot?> read(
  CampusCacheScope scope, [
  String? bindingRevision,
])
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `scope` | `CampusCacheScope` | 要读取的作用域（site + accountId） |
| `bindingRevision` | `String?`，位置可选 | 传入时只认该绑定版本的行，用于确认快照与当前校园绑定一致 |

无行、campus 类别被挂起或校验失败（schema 版本、大小、时效、数据集键与状态）时返回 null；校验失败会顺带删除该行，下次读取按无缓存处理。

#### write

```dart
Future<CampusSnapshot> write(
  CampusCacheScope scope,
  String bindingRevision,
  Map<String, CampusDataset> data, {
  DateTime? committedAt,
  int? expectedGeneration,
})
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `scope` | `CampusCacheScope` | 写入的作用域 |
| `bindingRevision` | `String` | 当前校园身份绑定的版本号，随行落盘 |
| `data` | `Map<String, CampusDataset>` | 四个白名单数据集，必须齐全且各自合法 |
| `committedAt` | `DateTime?`，命名可选 | 覆盖提交时间（转 UTC 落盘），缺省取 `now()` |
| `expectedGeneration` | `int?`，命名可选 | 外部捕获的代际；传入后用它代替当前代际做围栏 |

写入流程：校验通过后在事务内 `INSERT OR REPLACE` 并淘汰超出 `maxScopes` 的旧行，事务后触发 `maintainBudget`，事务前后各复查一次代际与类别可用性。返回写好的 `CampusSnapshot`。

| 异常 | 抛出条件 |
| --- | --- |
| `ArgumentError` | `bindingRevision` 为空，或 `data` 缺少白名单键、键名与数据集不符、状态不是 ready 或 empty |
| `StateError` | 序列化后的 payload 超过 `maxBytes` |
| `CampusSnapshotSuperseded` | 代际不匹配（缓存 epoch 已变化）或 campus 类别被挂起，事务前后都可能抛出 |

#### clearScope

```dart
Future<void> clearScope(CampusCacheScope scope)
```

删除单个作用域的全部行，并递增代际作废队列中的旧读写。校园页在绑定版本变化、授权失效或解绑时用它清掉当前作用域，可附带小组件的终态标识（`needsData` / `unbound` / `authorizationRequired` 等）。

#### clear

```dart
Future<void> clear()
```

清空整张 `campus_snapshots` 表并递增代际。由 campus 类别的 `CacheOwner` 在用户清除校园缓存时调用，同一流程会连带清空小组件共享存储。

#### invalidate

```dart
void invalidate()
```

只递增代际，不碰数据。队列里尚未执行的旧读写会因代际不匹配而作废。

### 内部机制

实例方法的互斥由两个私有成员和一个计数器实现：

| 成员 | 说明 |
| --- | --- |
| `_tail` | 串行队列的尾部，保存最近一个已入队操作的 Future，初值为已完成的 Future |
| `_serialize` | 把新操作链接到 `_tail` 之后的包装函数，所有实例方法的函数体都包在它里面 |
| `generation` | 代际计数器，`invalidate()` 递增；`write` 入队时记下当前代际（或调用方传入的 `expectedGeneration`），执行时与最新代际比对 |

**`_serialize` 的函数体只有三行，互斥全靠它们：**

```dart
final result = _tail.then((_) => operation());
_tail = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
return result;
```

- 第一行把 `operation` 链在 `_tail` 之后——只有前面的操作全部完成，`operation` 才开始执行，同一时刻只有一个读写真正运行，按调用顺序先来先服务。"校验失败后删行""写入后淘汰旧行"这类多步操作因此不会被并发读写交错打断。
- 第二行把 `_tail` 推进到本次操作，且错误在这里吞掉——单个操作失败（比如被围栏作废的旧写入抛 `CampusSnapshotSuperseded`）不会阻断后面排队的操作。
- 返回值是 `result` 本身，调用方照常拿到结果或异常。

队列只保证互斥；不合时宜的操作由另外两层闸门处理：类别挂起时操作在入口直接失败，代际不匹配时操作自行作废。

### 相关类型

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `CampusCacheScope` | `site`、`accountId` | 缓存作用域：API origin 加数字账号 ID |
| `CampusSnapshot` | `bindingRevision`、`committedAt`、`data` | 一次读写的完整结果：绑定版本、提交时间和四个数据集的映射 |
| `CampusDataset` | `key`、`status`、`updatedAt`、`metrics`、`columns`、`rows`、`events`、`series`、`messages`、`teachingDay` | 单类数据集；`status` 只能是 ready 或 empty |

### 边界

两条隐私边界值得单说。`binding_revision` 是服务端 `/api/campus` 返回的校园身份绑定版本号，复用快照前必须与当前绑定版本一致，重新绑定或换绑学号后旧快照整体作废，防止上一份课表和资料串给新绑定。payload 里的 `messages` 恒为空数组——消息摘要和正文刻意不序列化，凭据和非白名单数据集进不了这个 store。

桌面小组件消费的课表投影就派生自这份快照，细节见[桌面小组件](/development/mobile/widgets)。

## 本机写作

`WritingStore` 按 API origin 与数字账号 ID 隔离未完成草稿和最近搜索，token 永远不进这个 store。每次新建写作会话使用独立 ID，不与其他会话共用内容槽位；云端草稿编辑、已发布话题编辑和按话题保存的回复分别命名。旧 v1 存储前缀保持可读，元数据只增不改，已有的恢复副本不会丢失。

行为细节（保留哪些内容、失败重试、撤销等）见 forum_app README 的"本机写作"一节。

## 凭据

`SecureTokenStorage` 基于 flutter_secure_storage 实现，落在 iOS Keychain / Android Keystore，保存论坛 token 和轻量的登录用户信息（供论坛 UI 展示）。聊天 outbox 的图片发送意图（用于 App 终止后恢复重试项）同样写入账号级安全存储，恢复出来的是显式重试项，不会自动重发网络请求。
