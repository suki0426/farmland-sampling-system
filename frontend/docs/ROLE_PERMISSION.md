# 角色赋权说明（农业智能监测平台）

> 适用对象：组长 / 负责系统配置的成员 / 5号（后端）
> 对应提交：`feature/monitor-ui`
> 前端权限码定义：`frontend/src/views/modules/agrimonitor/permissions.js`

---

## 一、平台原本的权限机制（先看懂这个，再动手）

读完代码后，本平台的权限模型是这样的：

| 层 | 机制 | 在哪 |
| --- | --- | --- |
| **菜单可见性** | 后端按用户角色查 `sys_menu`，只返回该角色配了 `sys_role_menu` 的菜单 | `MenuMapper.xml` 的 `findByUserId` |
| **权限码** | `GET /sys/user/getMenus` 返回 `permissions` = 该用户**所有角色**的 `sys_menu.permission` 去重集合 | `UserController.getMenus` → `UserUtils.getPermissions()` |
| **菜单渲染** | 前端左侧菜单直接渲染后端返回的 `menuList`，**前端不做角色判断** | `views/layout/_common_left.vue` + `_common_left_submenu.vue` |
| **按钮显隐** | 页面内 `hasPermission('xxx:yyy:add')` 读 `localStorage.permissions` | `utils/index.js` |
| **路由守卫** | 平台原本**只校验 token 是否存在**，不校验权限 | `router/authGuard.js` |
| **用户注册** | **没有注册入口**，账号由管理员在「系统管理 → 用户管理」里创建 | `views/modules/sys/login/login.vue` |

**结论**：
1. "采集员不该看到数据库管理" —— 只要**不给他配那条菜单**，左侧菜单里就不会出现。这是后端配置的事。
2. 但**静态路由**（我在 `staticRoutes.js` 里注册的那 4 条）的副作用是
   **任何登录用户敲 URL 都能进**。所以本次补了一层**路由级权限校验**。

---

## 二、本次前端做了什么（代码层面）

### 2.1 新增 4 个权限码

命名遵循 `TEAM_DEVELOPMENT_STANDARD.md` §6 的 `<module>:<CamelResource>:<action>`：

| 页面 | 路由 path | 权限码 | 建议给谁 |
| --- | --- | --- | --- |
| 首页监控大屏 | `/agrimonitor/Dashboard` | `agrimonitor:dashboard:view` | **所有角色** |
| 地区监控 | `/agrimonitor/RegionMonitor` | `agrimonitor:regionMonitor:view` | 管理员、采集员、分析员 |
| 数据库管理 | `/agrimonitor/DatabaseManage` | `agrimonitor:databaseManage:view` | **仅管理员** |
| 遥感分析 | `/agrimonitor/RemoteSensing` | `agrimonitor:remoteSensing:view` | 管理员、分析员 |

### 2.2 路由级守卫

`src/router/staticRoutes.js` 里每条路由都加了：

```js
{
  path: '/agrimonitor/DatabaseManage',
  component: _import('modules/agrimonitor/DatabaseManage'),
  name: 'agri-database',
  meta: { title: '数据库管理', singleTab: true, permission: PERM_DATABASE_MANAGE },
  beforeEnter: requirePermission(PERM_DATABASE_MANAGE)
}
```

守卫逻辑（`permissions.js`）：

- 读 `localStorage.permissions`（与平台自带 `utils.hasPermission()` **语义完全一致**）；
- **权限列表为空 / 缺失时一律拒绝**，不做"取不到就放行"的兜底
  （那正是 GIS 模块合并评审里被点名的「权限默认放行」问题）；
- 没有权限 → 跳到 `/agrimonitor/NoPermission`，
  页面上会写明「被拦截的页面、缺少的权限码、当前已有权限」，而不是误导性的 404。

实现上刻意**用路由级 `beforeEnter` 而不是改全局 `authGuard.js`**：
影响面只限于本模块 4 条路由，不会动到其他成员的页面跳转逻辑。

### 2.3 前端**没有**做的事（重要）

- ❌ 没有判断"是不是管理员"，没有写死任何角色名 —— 符合 §6「业务成员不得绕过鉴权或写死管理员判断」；
- ❌ 没有改 `authGuard.js`、没有改菜单渲染组件；
- ❌ 没有加注册入口（平台本来就没有，也确认不需要）。

> 演示入口 `monitor.html` 里有一个**角色模拟**下拉框，那是**演示壳的菜单过滤**，
> 用于答辩时现场演示"管理员看到 4 个、采集员只看到 1 个"。
> 它不是鉴权实现，正式页面永远走 `localStorage.permissions`。

---

## 三、需要后端/组长配置的部分（SQL）

> ⚠️ **这一段是配置数据，不是代码**。`sys_menu` / `sys_role_menu` 属于平台配置，
> 按 §6 应由负责系统配置的成员维护。下面 SQL 已按真实表结构写好，可直接执行。
>
> 表结构依据：`Menu` / `TreeEntity` / `BaseEntity` 实体 + `MenuMapper.xml` 的 `menuColumns`。
> 列清单：`id, parent_id, parent_ids, name, sort, href, target, icon, is_show, menu_type,
> permission, affix, remarks, create_by, create_date, update_by, update_date, del_flag`

### 3.1 先看一眼现状（务必先执行，确认自己的库长得一样）

```sql
-- 看一条现有"页面级"菜单长什么样，下面的 SQL 会照抄它的 menu_type 等约定值
SELECT id, parent_id, parent_ids, name, sort, href, target, icon, is_show, menu_type, permission, affix, del_flag
FROM sys_menu
WHERE del_flag = 0 AND href LIKE '/dteachingdocument%'
LIMIT 3;

-- 看现有角色（拿到 role id / name）
SELECT id, name, enname, useable, del_flag FROM sys_role WHERE del_flag = 0;
```

### 3.2 新增"农业监测"父菜单 + 4 个子页面

```sql
START TRANSACTION;

-- ① 照抄现有页面级菜单的约定值，避免猜 menu_type / is_show / target 的取值
SET @tpl_menu_type = (SELECT menu_type FROM sys_menu WHERE del_flag = 0 AND href LIKE '/dteachingdocument%' LIMIT 1);
SET @tpl_is_show   = (SELECT is_show   FROM sys_menu WHERE del_flag = 0 AND href LIKE '/dteachingdocument%' LIMIT 1);
SET @tpl_icon_page = (SELECT icon      FROM sys_menu WHERE del_flag = 0 AND href LIKE '/dteachingdocument%' LIMIT 1);
SET @now = NOW();
SET @operator = 'system';

-- ② 父菜单（目录）：左侧菜单里的一级分组
INSERT INTO sys_menu
  (id, parent_id, parent_ids, name, sort, href, target, icon, is_show, menu_type, permission, affix, remarks,
   create_by, create_date, update_by, update_date, del_flag)
VALUES
  ('agri-monitor', '0', '0,', '农业监测', 900, '', '', 'el-icon-s-data', @tpl_is_show, @tpl_menu_type, '', '0',
   '农业智能监测平台（1号 前端交付）', @operator, @now, @operator, @now, 0);

-- ③ 四个页面子菜单
INSERT INTO sys_menu
  (id, parent_id, parent_ids, name, sort, href, target, icon, is_show, menu_type, permission, affix, remarks,
   create_by, create_date, update_by, update_date, del_flag)
VALUES
  ('agri-dashboard',  'agri-monitor', '0,agri-monitor,', '监测大屏',   1, '/agrimonitor/Dashboard',      '',
   'el-icon-s-data',               @tpl_is_show, @tpl_menu_type, 'agrimonitor:dashboard:view',      '0', '天气图层/3D地形双视图、三级下钻、任务书指标区', @operator, @now, @operator, @now, 0),
  ('agri-region',     'agri-monitor', '0,agri-monitor,', '地区监控',   2, '/agrimonitor/RegionMonitor',  '',
   'el-icon-location-outline',     @tpl_is_show, @tpl_menu_type, 'agrimonitor:regionMonitor:view',  '0', '省市区三级选择、数据报表/路线/设备/预警',       @operator, @now, @operator, @now, 0),
  ('agri-database',   'agri-monitor', '0,agri-monitor,', '数据库管理', 3, '/agrimonitor/DatabaseManage', '',
   'el-icon-coin',                 @tpl_is_show, @tpl_menu_type, 'agrimonitor:databaseManage:view', '0', '备份与运维配置（纯界面，不动数据库）',          @operator, @now, @operator, @now, 0),
  ('agri-remote',     'agri-monitor', '0,agri-monitor,', '遥感分析',   4, '/agrimonitor/RemoteSensing',  '',
   'el-icon-guide',                @tpl_is_show, @tpl_menu_type, 'agrimonitor:remoteSensing:view',  '0', '北斗/GNSS 卫星星历、可见性与过境预报',          @operator, @now, @operator, @now, 0);

-- ④ 授权：管理员拿全部 4 个
--    ⚠️ 把下面的 role id 换成第 3.1 节查出来的真实 id
SET @role_admin = (SELECT id FROM sys_role WHERE del_flag = 0 AND (name LIKE '%管理员%' OR enname IN ('admin','administrator')) LIMIT 1);

INSERT INTO sys_role_menu (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), @role_admin, m.id
FROM sys_menu m
WHERE m.id IN ('agri-monitor', 'agri-dashboard', 'agri-region', 'agri-database', 'agri-remote');

-- ⑤ 授权：采集员只拿「大屏」（父菜单也要给，否则菜单树挂不上）
--    如果还没有"采集员"角色，先在「系统管理 → 角色管理」里建一个，再把 id 填进来
SET @role_collector = (SELECT id FROM sys_role WHERE del_flag = 0 AND (name LIKE '%采集%' OR enname LIKE '%collect%') LIMIT 1);

INSERT INTO sys_role_menu (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), @role_collector, m.id
FROM sys_menu m
WHERE m.id IN ('agri-monitor', 'agri-dashboard');

-- 确认无误后提交；有问题就 ROLLBACK
-- COMMIT;
-- ROLLBACK;
```

> ⚠️ `sys_role_menu` 的实际列名请先用
> `SELECT * FROM sys_role_menu LIMIT 3;` 确认一遍
> （不同 JeePlus 版本主键列名可能是 `id` 或 `menu_id+role_id` 组合）。
> 若该表只有 `role_id`/`menu_id` 两列，把上面 `INSERT ... SELECT` 里的
> `REPLACE(UUID(),'-',''),` 去掉即可。

### 3.3 采集员角色建议的权限组合

| 功能 | 管理员 | 采集员 | 分析员 |
| --- | :---: | :---: | :---: |
| 监测大屏 `agrimonitor:dashboard:view` | ✅ | ✅ | ✅ |
| 地区监控 `agrimonitor:regionMonitor:view` | ✅ | ➖（按需） | ✅ |
| 数据库管理 `agrimonitor:databaseManage:view` | ✅ | ❌ | ❌ |
| 遥感分析 `agrimonitor:remoteSensing:view` | ✅ | ❌ | ✅ |

> 采集员"只需要监控大屏"就够 —— 大屏底部已经包含任务书的
> M1~M4 / E1~E4 / T1~T5 对照、19 字节回传帧、E1 布点策略、E2 路线算法对比，
> 所以算法相关的展示不需要单独再开一个页面给采集员。

---

## 四、怎么验证配置生效

### 4.1 后端/组长侧

```sql
-- 权限码是否已挂到角色上（应能查到 4 行 / 或 1 行）
SELECT r.name AS role, m.name AS menu, m.permission
FROM sys_role_menu rm
JOIN sys_role r ON r.id = rm.role_id
JOIN sys_menu m ON m.id = rm.menu_id
WHERE m.id LIKE 'agri-%' AND m.del_flag = 0 AND r.del_flag = 0
ORDER BY r.name, m.sort;
```

### 4.2 前端侧（两种角色各登一次）

1. 用**管理员**账号登录 → 左侧应出现「农业监测」分组，下面 4 个菜单全在；
   浏览器控制台执行 `JSON.parse(localStorage.permissions)` 应能看到 4 个 `agrimonitor:*` 权限码。
2. 用**采集员**账号登录 → 左侧「农业监测」下**只有「监测大屏」**；
   控制台里 `permissions` 只有 `agrimonitor:dashboard:view`。
3. **越权测试**（关键）：采集员登录后，地址栏直接敲
   `/#/agrimonitor/DatabaseManage` → 应跳到「无访问权限」提示页，
   并显示缺少的权限码 `agrimonitor:databaseManage:view`。

### 4.3 不配菜单会怎样（预期行为）

如果还没执行第 3.2 节的 SQL：

- 左侧菜单里**不会**出现「农业监测」分组（后端没下发）；
- 但直接敲 `/#/agrimonitor/Dashboard` 会被路由守卫拦下 →
  跳「无访问权限」页（因为 `localStorage.permissions` 里没有对应权限码）。

这是**有意的严格行为**：宁可提示无权限，也不做"没配就放行"。
若临时需要在未配置菜单的情况下看页面，用免登录的演示入口
`http://localhost:3000/monitor.html`（仅非生产构建产出）。

---

## 五、QA / 答辩演示怎么用

演示入口内置了角色模拟，可以直接演示角色差异：

| 地址 | 效果 |
| --- | --- |
| `monitor.html` | 默认「管理员」：左侧 4 个菜单全在 |
| `monitor.html?role=collector` | 「采集员」：左侧只剩「监测大屏」，并提示"该角色无权限的功能已隐藏：地区监控、数据库管理、遥感分析" |
| `monitor.html?role=analyst` | 「分析员」：大屏 + 地区监控 + 遥感分析，不含数据库管理 |

答辩时的说法：

> "正式环境里菜单由后端按角色下发，前端不判断角色；
> 直接敲 URL 还有一层路由级权限校验，没权限会跳到提示页并告诉你缺哪个权限码。
> 演示入口是免登录的，所以我放了一个角色模拟开关，可以现场看菜单是怎么随角色变化的。"

---

## 六、改动文件清单（本节相关）

| 文件 | 改动 |
| --- | --- |
| `src/views/modules/agrimonitor/permissions.js` | **新增**：4 个权限码常量 + `requirePermission()` 守卫工厂 |
| `src/views/modules/agrimonitor/NoPermission.vue` | **新增**：无权限提示页 |
| `src/router/staticRoutes.js` | 4 条路由加 `meta.permission` + `beforeEnter`；新增 1 条 NoPermission 路由 |
| `src/monitordemo/roles.js` | **新增**：演示用角色 → 权限码映射 |
| `src/monitordemo/Shell.vue` | 新增角色模拟下拉框 + 菜单按权限过滤 |
| `src/assets/scss/login.scss` | 登录页改深色主题（与监测平台统一） |

> `staticRoutes.js` 与 `login.scss` 是**共享文件**，合并注意事项见交付文件夹的
> `10-与GIS模块的合并注意事项.md`（`staticRoutes.js` 与 GIS 分支有 1 行重叠）。
