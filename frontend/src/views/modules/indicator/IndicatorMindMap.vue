<template>
  <div class="indicator-mind-map ultra-theme ul-feature-page">
    <input
      ref="importInput"
      class="indicator-mind-map__file-input"
      type="file"
      accept=".xls,.xlsx"
      @change="handleImportFileChange"
    >
    <section class="indicator-mind-map__shell ul-feature-surface ul-feature-surface--large">
      <header class="indicator-mind-map__toolbar ul-feature-header">
        <div class="indicator-mind-map__title ul-feature-headline">
          <span class="indicator-mind-map__eyebrow ul-feature-eyebrow">指标管理</span>
          <h1 class="ul-feature-title">指标管理</h1>
        </div>

        <div class="indicator-mind-map__status">
          <span>当前数据：{{ rootNode ? rootNode.name : '暂无数据' }}</span>
          <span>{{ rootOptions.length }} 个节点</span>
        </div>
      </header>

      <div class="indicator-mind-map__controls">
        <div class="indicator-mind-map__control-group indicator-mind-map__control-group--root">
          <el-select
            v-model="rootId"
            filterable
            size="small"
            popper-class="indicator-mind-map__select-popper"
            :popper-append-to-body="false"
            placeholder="选择根节点"
            @change="handleRootChange"
          >
            <el-option
              v-for="item in rootOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>

        <div class="indicator-mind-map__control-group indicator-mind-map__control-group--search">
          <el-input
            v-model="keyword"
            class="indicator-mind-map__search"
            clearable
            size="small"
            placeholder="搜索节点名称"
            @input="handleKeywordChange"
            @clear="handleKeywordChange"
          />
          <span
            class="indicator-mind-map__match-count"
            :class="{ 'is-idle': !hasSearchKeyword, 'is-empty': hasSearchKeyword && !matchedNodes.length }"
          >
            {{ hasSearchKeyword ? (matchedNodes.length ? `${activeMatchIndex + 1}/${matchedNodes.length}` : '无匹配') : '匹配' }}
          </span>
          <el-tooltip content="上一个匹配节点" placement="top" :open-delay="180">
            <el-button
              size="small"
              circle
              icon="el-icon-arrow-left"
              :disabled="!matchedNodes.length"
              @click="focusPrevMatch"
            />
          </el-tooltip>
          <el-tooltip content="下一个匹配节点" placement="top" :open-delay="180">
            <el-button
              size="small"
              circle
              icon="el-icon-arrow-right"
              :disabled="!matchedNodes.length"
              @click="focusNextMatch"
            />
          </el-tooltip>
        </div>

        <div class="indicator-mind-map__control-group indicator-mind-map__control-group--actions">
          <div class="indicator-mind-map__action-cluster">
            <el-button
              v-if="!maintenanceEnabled"
              type="primary"
              size="small"
              round
              icon="el-icon-upload2"
              :loading="importing"
              @click="chooseImportFile"
            >
              导入
            </el-button>
            <el-button
              class="indicator-mind-map__maintenance-button"
              size="small"
              round
              plain
              icon="el-icon-rank"
              :type="maintenanceEnabled ? 'info' : undefined"
              @click="toggleMaintenanceMode"
            >
              {{ maintenanceEnabled ? '退出维护' : '维护排序' }}
            </el-button>
          </div>

          <div v-if="maintenanceEnabled" class="indicator-mind-map__action-cluster indicator-mind-map__action-cluster--draft">
            <el-button
              type="primary"
              size="small"
              round
              icon="el-icon-document-checked"
              :loading="saveDraftLoading"
              :disabled="!hasPendingStructureChange || saveDraftLoading"
              @click="saveStructureDraft"
            >
              保存调整
            </el-button>
            <el-button
              size="small"
              round
              icon="el-icon-refresh-left"
              :disabled="!hasPendingStructureChange || saveDraftLoading"
              @click="discardStructureDraft"
            >
              放弃调整
            </el-button>
          </div>

          <div class="indicator-mind-map__action-cluster indicator-mind-map__action-cluster--view">
            <el-tooltip content="居中导图" placement="top" :open-delay="180">
              <el-button size="small" circle icon="el-icon-aim" @click="centerRoot" />
            </el-tooltip>
            <el-tooltip content="重置视图" placement="top" :open-delay="180">
              <el-button size="small" circle icon="el-icon-refresh-right" @click="resetView" />
            </el-tooltip>
          </div>
        </div>
      </div>

      <main
        class="indicator-mind-map__workspace"
        :class="{ 'is-inspector-collapsed': inspectorCollapsed }"
      >
        <section
          ref="canvas"
          class="indicator-mind-map__canvas"
          :class="{ 'is-panning': isPanning }"
          @mousedown="startPan"
          @mousemove="handlePan"
          @mouseup="stopPan"
          @mouseleave="stopPan"
          @wheel.prevent="handleWheel"
        >
          <div v-if="loading" class="indicator-mind-map__state">
            <i class="el-icon-loading" />
            <span>正在加载指标导图</span>
          </div>

          <div v-else-if="!rootNode" class="indicator-mind-map__state">
            <i class="el-icon-folder-opened" />
            <span>暂无指标数据，可先导入 .xls 或 .xlsx 文件。</span>
            <el-button type="primary" size="small" round :loading="importing" @click="chooseImportFile">去导入</el-button>
          </div>

          <svg
            v-else
            class="indicator-mind-map__svg"
            :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
            role="img"
            aria-label="指标导图"
          >
            <defs>
              <linearGradient
                id="indicator-mind-map-link-gradient"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                :x2="canvasWidth"
                y2="0"
              >
                <stop offset="0%" stop-color="#0f172a" />
                <stop offset="52%" stop-color="var(--ul-primary)" />
                <stop offset="100%" stop-color="var(--ul-brand-end)" />
              </linearGradient>
            </defs>
            <g :transform="`translate(${pan.x}, ${pan.y}) scale(${scale})`">
              <g class="indicator-mind-map__links">
                <path
                  v-for="link in graph.links"
                  :key="link.id"
                  class="indicator-mind-map__link"
                  :class="{ 'is-active': isPathLink(link), 'is-muted': selectedPathIds.length > 1 && !isPathLink(link) }"
                  :d="link.path"
                  stroke="url(#indicator-mind-map-link-gradient)"
                  :stroke-width="isPathLink(link) ? 6 : 4"
                  stroke-linecap="round"
                />
              </g>
              <foreignObject
                v-for="item in graph.nodes"
                :key="item.node.id"
                :x="item.x - nodeSafeMargin"
                :y="item.y - nodeSafeMargin"
                :width="nodeWidth + nodeSafeMargin * 2"
                :height="nodeHeight + nodeSafeMargin * 2"
              >
                <div xmlns="http://www.w3.org/1999/xhtml" class="indicator-mind-map__node-frame">
                  <button
                    class="indicator-mind-map__node"
                    :class="[
                      `is-level-${item.node.level || 1}`,
                      {
                        'is-selected': selectedId === item.node.id,
                        'is-matched': isMatchedNode(item.node),
                        'is-active-match': isActiveMatchedNode(item.node),
                        'is-collapsed': isNodeCollapsed(item.node),
                        'has-children': hasNodeChildren(item.node),
                        'is-maintenance-mode': maintenanceEnabled,
                        'is-drag-source': isDragSource(item.node),
                        'is-drop-target': isDropTarget(item.node),
                        'is-drop-before': isDropBeforeTarget(item.node),
                        'is-drop-after': isDropAfterTarget(item.node),
                        'is-drop-invalid': isInvalidDropTarget(item.node)
                      }
                    ]"
                    :draggable="canDragNode(item.node)"
                    type="button"
                    @mousedown.stop
                    @dragstart.stop="handleNodeDragStart($event, item.node)"
                    @dragenter.stop.prevent="handleNodeDragEnter(item.node)"
                    @dragover.stop.prevent="handleNodeDragOver($event, item.node)"
                    @drop.stop.prevent="handleNodeDrop(item.node)"
                    @dragend.stop="handleNodeDragEnd"
                    @click="selectNode(item.node)"
                  >
                    <span
                      v-if="hasNodeChildren(item.node)"
                      class="indicator-mind-map__node-toggle"
                      @mousedown.stop
                      @click.stop="toggleNodeCollapse(item.node)"
                    >
                      {{ isNodeCollapsed(item.node) ? '+' : '-' }}
                    </span>
                    <strong>{{ item.node.name }}</strong>
                    <span class="indicator-mind-map__node-meta">
                      {{ item.node.level || 1 }} 级 · 权重 {{ item.node.weight || '-' }}
                    </span>
                  </button>
                </div>
              </foreignObject>
            </g>
          </svg>

          <div v-if="rootNode && hasSearchKeyword && !matchedNodes.length" class="indicator-mind-map__search-empty">
            <i class="el-icon-search" />
            <span>未找到匹配的节点名称</span>
          </div>

          <div
            v-if="rootNode && maintenanceEnabled"
            class="indicator-mind-map__maintain-hint"
            :class="{ 'is-warning': dragState.invalidReason }"
          >
            <i :class="dragState.invalidReason ? 'el-icon-warning-outline' : 'el-icon-rank'" />
            <span>{{ dragHintText }}</span>
          </div>

          <div v-if="rootNode" class="indicator-mind-map__zoom">
            <button type="button" @click.stop="zoomOut">-</button>
            <span>{{ Math.round(scale * 100) }}%</span>
            <button type="button" @click.stop="zoomIn">+</button>
          </div>
        </section>

        <aside
          class="indicator-mind-map__inspector"
          :class="{ 'is-collapsed': inspectorCollapsed }"
        >
          <el-tooltip :content="inspectorCollapsed ? '展开详情' : '收起详情'" placement="left" :open-delay="180">
            <button
              class="indicator-mind-map__inspector-toggle"
              type="button"
              @click="inspectorCollapsed = !inspectorCollapsed"
            >
              <i :class="inspectorCollapsed ? 'el-icon-arrow-left' : 'el-icon-arrow-right'" />
            </button>
          </el-tooltip>

          <div v-if="inspectorCollapsed" class="indicator-mind-map__inspector-rail">
            <span>详情</span>
            <strong>{{ selectedNode ? `${selectedNode.level || 1}级` : '-' }}</strong>
          </div>

          <template v-else>
            <div class="indicator-mind-map__panel-head">
              <span>节点详情</span>
              <em>{{ selectedNode ? `${selectedNode.level || 1} 级节点` : '未选择' }}</em>
            </div>

            <section v-if="maintenanceEnabled" class="indicator-mind-map__maintain-panel">
              <div class="indicator-mind-map__maintain-head">
                <strong>排序草稿</strong>
                <el-tag size="mini" :type="hasPendingStructureChange ? 'warning' : 'success'">
                  {{ hasPendingStructureChange ? `待保存 ${structureDraftPayload.changedParentCount}` : '已同步' }}
                </el-tag>
              </div>
              <div class="indicator-mind-map__maintain-rules indicator-mind-map__maintain-rules--summary">
                <span>{{ structureDraftPayload.changedParentCount }} 个父节点</span>
                <span>{{ structureDraftPayload.changedNodeCount }} 个排序项</span>
              </div>
              <div v-if="lastStructureChangeText" class="indicator-mind-map__maintain-log">
                {{ lastStructureChangeText }}
              </div>
            </section>

            <template v-if="selectedNode">
              <h2>{{ selectedNode.name }}</h2>
              <p class="indicator-mind-map__description">{{ selectedNode.description || '暂无说明' }}</p>

              <dl class="indicator-mind-map__facts">
                <div>
                  <dt>指标级别</dt>
                  <dd>{{ selectedNode.level || 1 }} 级</dd>
                </div>
                <div>
                  <dt>父指标</dt>
                  <dd>{{ parentName }}</dd>
                </div>
                <div>
                  <dt>当前权重</dt>
                  <dd>{{ selectedNode.weight || '-' }}</dd>
                </div>
                <div>
                  <dt>最近更新</dt>
                  <dd>{{ selectedNode.updatedAt || '-' }}</dd>
                </div>
                <div>
                  <dt>子指标数</dt>
                  <dd>{{ childCount }}</dd>
                </div>
              </dl>

              <div class="indicator-mind-map__path">
                <span>当前位置</span>
                <p>{{ selectedPathText }}</p>
              </div>

              <div class="indicator-mind-map__actions ul-action-group">
                <el-button type="primary" size="small" round @click="handleEdit">编辑叶子节点</el-button>
              </div>
            </template>

            <div v-else class="indicator-mind-map__empty-detail">
              选择导图中的节点后查看名称、级别、父指标、权重、说明和最近更新时间。
            </div>
          </template>
        </aside>
      </main>
    </section>

    <el-dialog
      title="编辑叶子节点"
      width="520px"
      :visible.sync="editDialogVisible"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="editForm" size="small" label-width="92px" :model="editForm">
        <el-form-item
          label="指标名称"
          prop="name"
          :rules="[{ required: true, message: '指标名称不能为空', trigger: 'blur' }]"
        >
          <el-input v-model="editForm.name" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="指标权重" prop="weight">
          <el-input v-model="editForm.weight" maxlength="20" placeholder="例如 20%" />
        </el-form-item>
        <el-form-item label="指标说明" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="editDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="editSaving" @click="submitLeafEdit">
          保存
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import indicatorService from '@/api/indicator'
import {
  applyIndicatorLeafEdit,
  createIndicatorMindMapLoadState,
  createIndicatorLeafEditForm,
  getFirstIndicatorMatchIndex,
  getIndicatorMatchFocusTarget,
  getNextIndicatorMatchIndex,
  getPreviousIndicatorMatchIndex
} from './indicatorMindMapState'
import { normalizeIndicatorImportResult, normalizeIndicatorTree } from '@/utils/indicatorAdapter'
import { validateTemplateFile } from '@/components/indicatorImport/utils'
import { resolveErrorMessage } from '@/utils/errorMessage'
import {
  createEmptyIndicatorDragState,
  createIndicatorStructureChangeEntry,
  getIndicatorDragHintText,
  resolveIndicatorDragTargetState,
  resolveIndicatorDropPlacement,
  resolveIndicatorMoveReasonMessage
} from '@/utils/indicatorSortDraft'
import {
  INDICATOR_MIND_MAP_NODE_WIDTH,
  INDICATOR_MIND_MAP_NODE_HEIGHT,
  INDICATOR_MIND_MAP_NODE_SAFE_MARGIN,
  buildIndicatorMindMapGraph,
  findIndicatorMindMapMatches,
  getIndicatorMindMapNodeCenter,
  getIndicatorMindMapPathIds,
  isIndicatorMindMapPathLink
} from '@/utils/indicatorMindMap'
import {
  buildIndicatorOrderDraft,
  buildIndicatorOrderSubmitPayload,
  cloneIndicatorTree,
  flattenIndicatorTree,
  findIndicatorNode,
  findIndicatorPath,
  getChildCount,
  moveIndicatorNode
} from '@/utils/indicatorTree'

export default {
  name: 'IndicatorMindMap',
  data () {
    return {
      loading: false,
      importing: false,
      mockEnabled: true,
      treeData: [],
      rootId: '',
      selectedId: '',
      keyword: '',
      activeMatchIndex: 0,
      collapsedNodeIds: [],
      maintenanceEnabled: false,
      inspectorCollapsed: false,
      saveDraftLoading: false,
      savedTreeDataSnapshot: [],
      lastSavedStructurePayload: null,
      structureChangeLog: [],
      dragState: createEmptyIndicatorDragState(),
      editDialogVisible: false,
      editSaving: false,
      editForm: {
        id: '',
        name: '',
        weight: '',
        description: ''
      },
      scale: 1,
      pan: {
        x: 42,
        y: 42
      },
      isPanning: false,
      panStart: {
        x: 0,
        y: 0,
        panX: 0,
        panY: 0
      },
      nodeWidth: INDICATOR_MIND_MAP_NODE_WIDTH,
      nodeHeight: INDICATOR_MIND_MAP_NODE_HEIGHT,
      nodeSafeMargin: INDICATOR_MIND_MAP_NODE_SAFE_MARGIN
    }
  },
  computed: {
    rootOptions () {
      return flattenIndicatorTree(this.treeData)
    },
    rootNode () {
      return findIndicatorNode(this.treeData, this.rootId)
    },
    selectedNode () {
      return findIndicatorNode(this.treeData, this.selectedId)
    },
    selectedPath () {
      return findIndicatorPath(this.treeData, this.selectedId)
    },
    selectedPathText () {
      return this.selectedPath.length ? this.selectedPath.map(item => item.name).join(' / ') : '-'
    },
    parentName () {
      if (this.selectedPath.length <= 1) return '一级指标'
      return this.selectedPath[this.selectedPath.length - 2].name
    },
    childCount () {
      return getChildCount(this.selectedNode)
    },
    isSelectedLeaf () {
      return Boolean(this.selectedNode && !getChildCount(this.selectedNode))
    },
    matchedNodes () {
      return findIndicatorMindMapMatches(this.rootNode, this.keyword)
    },
    matchedNodeIds () {
      return this.matchedNodes.map(item => item.id)
    },
    activeMatchedNode () {
      return this.matchedNodes[this.activeMatchIndex] || null
    },
    hasSearchKeyword () {
      return Boolean(String(this.keyword || '').trim())
    },
    selectedPathIds () {
      return getIndicatorMindMapPathIds(this.selectedPath)
    },
    structureDraftPayload () {
      return buildIndicatorOrderDraft(this.savedTreeDataSnapshot, this.treeData)
    },
    structureSubmitPayload () {
      return buildIndicatorOrderSubmitPayload({
        rootId: this.rootId,
        baseTree: this.savedTreeDataSnapshot,
        currentTree: this.treeData
      })
    },
    hasPendingStructureChange () {
      return this.structureDraftPayload.changedParentCount > 0
    },
    firstChangedParent () {
      return this.structureDraftPayload.changedParents[0] || null
    },
    dragHintText () {
      return getIndicatorDragHintText({
        dragState: this.dragState,
        treeData: this.treeData,
        hasPendingStructureChange: this.hasPendingStructureChange,
        pendingChangeCount: this.structureChangeLog.length
      })
    },
    lastStructureChangeText () {
      return this.structureChangeLog.length
        ? this.structureChangeLog[this.structureChangeLog.length - 1].text
        : ''
    },
    graph () {
      return buildIndicatorMindMapGraph(this.rootNode, {
        collapsedIds: this.collapsedNodeIds
      })
    },
    canvasWidth () {
      return Math.max(this.graph.width + 140, 980)
    },
    canvasHeight () {
      return Math.max(this.graph.height + 120, 620)
    }
  },
  created () {
    this.loadTree()
  },
  watch: {
    '$route.query.id' (id) {
      if (!id || id === this.selectedId || !this.treeData.length) return

      const path = findIndicatorPath(this.treeData, id)
      if (!path.length) return

      this.rootId = path[0].id
      this.selectedId = id
      this.expandPathToNode(id)
      this.$nextTick(() => this.centerNode(id))
    }
  },
  beforeDestroy () {
    this.stopPan()
  },
  methods: {
    async loadTree () {
      this.loading = true
      try {
        const response = await indicatorService.getIndicatorTree({ mock: this.mockEnabled })
        const list = normalizeIndicatorTree(response)
        const queryId = this.$route.query.id
        const nextState = createIndicatorMindMapLoadState(list, queryId)
        Object.assign(this, {
          treeData: nextState.treeData,
          rootId: nextState.rootId,
          selectedId: nextState.selectedId,
          keyword: nextState.keyword,
          activeMatchIndex: nextState.activeMatchIndex,
          collapsedNodeIds: nextState.collapsedNodeIds,
          maintenanceEnabled: nextState.maintenanceEnabled,
          savedTreeDataSnapshot: nextState.savedTreeDataSnapshot,
          lastSavedStructurePayload: nextState.lastSavedStructurePayload,
          structureChangeLog: nextState.structureChangeLog,
          dragState: nextState.dragState
        })
        if (nextState.focusNodeId) {
          this.expandPathToNode(nextState.focusNodeId)
          this.$nextTick(() => this.centerNode(nextState.focusNodeId))
        } else {
          this.$nextTick(() => this.centerRoot())
        }
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error, '加载指标导图失败'))
      } finally {
        this.loading = false
      }
    },
    handleRootChange (id) {
      this.selectedId = id
      this.keyword = ''
      this.activeMatchIndex = 0
      this.collapsedNodeIds = []
      this.centerRoot()
    },
    selectNode (node) {
      this.selectedId = node.id
    },
    toggleMaintenanceMode () {
      if (this.maintenanceEnabled && this.hasPendingStructureChange) {
        this.$message.info('当前有未保存的顺序调整，请先保存或放弃。')
        return
      }
      this.maintenanceEnabled = !this.maintenanceEnabled
      this.dragState = createEmptyIndicatorDragState()
    },
    canDragNode (node) {
      return Boolean(this.maintenanceEnabled && node && node.id !== this.rootId)
    },
    isDragSource (node) {
      return Boolean(node && this.dragState.sourceId === node.id)
    },
    isDropTarget (node) {
      return Boolean(
        node &&
        this.dragState.sourceId &&
        this.dragState.targetId === node.id &&
        !this.dragState.invalidReason
      )
    },
    isInvalidDropTarget (node) {
      return Boolean(
        node &&
        this.dragState.sourceId &&
        this.dragState.targetId === node.id &&
        this.dragState.invalidReason
      )
    },
    isDropBeforeTarget (node) {
      return Boolean(this.isDropTarget(node) && this.dragState.dropPlacement === 'before')
    },
    isDropAfterTarget (node) {
      return Boolean(this.isDropTarget(node) && this.dragState.dropPlacement !== 'before')
    },
    handleNodeDragStart (event, node) {
      if (!this.canDragNode(node)) {
        event.preventDefault()
        if (this.maintenanceEnabled && node && node.id === this.rootId) {
          this.$message.info('当前导图根节点暂不支持拖拽，请调整它的下级节点顺序。')
        }
        return
      }

      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', node.id)
      this.dragState = {
        ...createEmptyIndicatorDragState(),
        sourceId: node.id
      }
    },
    handleNodeDragEnter (node) {
      if (!this.dragState.sourceId) return
      this.dragState = resolveIndicatorDragTargetState({
        treeData: this.treeData,
        dragState: this.dragState,
        targetId: node.id
      })
    },
    handleNodeDragOver (event, node) {
      if (!this.dragState.sourceId) return
      const nextDragState = resolveIndicatorDragTargetState({
        treeData: this.treeData,
        dragState: this.dragState,
        targetId: node.id,
        dropPlacement: resolveIndicatorDropPlacement(event)
      })
      event.dataTransfer.dropEffect = nextDragState.invalidReason ? 'none' : 'move'
      if (
        this.dragState.targetId !== nextDragState.targetId ||
        this.dragState.invalidReason !== nextDragState.invalidReason ||
        this.dragState.dropPlacement !== nextDragState.dropPlacement
      ) {
        this.dragState = nextDragState
      }
    },
    handleNodeDrop (node) {
      if (!this.dragState.sourceId) return

      const placement = this.dragState.dropPlacement === 'before' ? 'before' : 'after'
      const result = moveIndicatorNode(this.treeData, this.dragState.sourceId, node.id, { placement })
      if (!result.moved) {
        this.$message.warning(resolveIndicatorMoveReasonMessage(result.reason))
        this.dragState = createEmptyIndicatorDragState()
        return
      }

      this.treeData = result.tree
      this.selectedId = result.sourceNode.id
      this.structureChangeLog = this.structureChangeLog.concat(createIndicatorStructureChangeEntry({
        sourceNode: result.sourceNode,
        targetNode: result.targetNode,
        placement
      }))
      this.dragState = createEmptyIndicatorDragState()
      this.$message.success(`已加入调整草稿：${result.sourceNode.name}`)
    },
    handleNodeDragEnd () {
      this.dragState = createEmptyIndicatorDragState()
    },
    async saveStructureDraft () {
      if (!this.hasPendingStructureChange) {
        this.$message.info('当前没有需要保存的顺序调整。')
        return
      }
      this.saveDraftLoading = true
      try {
        const payload = this.structureSubmitPayload
        const response = await indicatorService.saveIndicatorOrder(payload, { mock: this.mockEnabled })
        this.lastSavedStructurePayload = payload
        this.savedTreeDataSnapshot = cloneIndicatorTree(this.treeData)
        this.structureChangeLog = []
        this.dragState = createEmptyIndicatorDragState()
        this.$message.success((response && response.message) || `已保存 ${payload.changedParentCount} 组排序调整。`)
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error, '保存指标排序失败'))
      } finally {
        this.saveDraftLoading = false
      }
    },
    discardStructureDraft () {
      if (!this.hasPendingStructureChange) {
        this.$message.info('当前没有未保存的顺序调整。')
        return
      }
      this.treeData = cloneIndicatorTree(this.savedTreeDataSnapshot)
      this.structureChangeLog = []
      this.dragState = createEmptyIndicatorDragState()
      this.$nextTick(() => {
        if (this.selectedId) {
          this.centerNode(this.selectedId)
        }
      })
      this.$message.success('已放弃未保存的顺序调整。')
    },
    handleKeywordChange () {
      this.activeMatchIndex = 0
      const index = getFirstIndicatorMatchIndex(this.matchedNodes)
      if (index < 0) return
      this.focusMatchedNode(index)
    },
    focusPrevMatch () {
      const index = getPreviousIndicatorMatchIndex(this.activeMatchIndex, this.matchedNodes)
      if (index < 0) return
      this.focusMatchedNode(index)
    },
    focusNextMatch () {
      const index = getNextIndicatorMatchIndex(this.activeMatchIndex, this.matchedNodes)
      if (index < 0) return
      this.focusMatchedNode(index)
    },
    focusMatchedNode (index) {
      const node = getIndicatorMatchFocusTarget(this.matchedNodes, index)
      if (!node) return

      this.activeMatchIndex = index
      this.selectedId = node.id
      this.expandPathToNode(node.id)
      this.$nextTick(() => {
        this.centerNode(node.id)
      })
    },
    centerNode (nodeId) {
      const center = getIndicatorMindMapNodeCenter(this.graph, nodeId)
      if (!center) return

      this.scale = 1
      this.pan = {
        x: this.canvasWidth / 2 - center.x,
        y: this.canvasHeight / 2 - center.y
      }
    },
    toggleNodeCollapse (node) {
      if (!this.hasNodeChildren(node)) return

      const isCollapsed = this.isNodeCollapsed(node)
      if (isCollapsed) {
        this.collapsedNodeIds = this.collapsedNodeIds.filter(id => id !== node.id)
        return
      }

      if (this.selectedPathIds.indexOf(node.id) > -1 && this.selectedId !== node.id) {
        this.selectedId = node.id
      }
      this.collapsedNodeIds = [...this.collapsedNodeIds, node.id]
    },
    expandPathToNode (nodeId) {
      const pathIds = getIndicatorMindMapPathIds(findIndicatorPath(this.treeData, nodeId))
      if (!pathIds.length) return

      this.collapsedNodeIds = this.collapsedNodeIds.filter(id => pathIds.indexOf(id) === -1)
    },
    hasNodeChildren (node) {
      return Boolean(node && (node._mindMapChildCount || (node.children || []).length))
    },
    isNodeCollapsed (node) {
      return Boolean(node && this.collapsedNodeIds.indexOf(node.id) > -1)
    },
    isMatchedNode (node) {
      return Boolean(node && this.matchedNodeIds.indexOf(node.id) > -1)
    },
    isActiveMatchedNode (node) {
      return Boolean(node && this.activeMatchedNode && this.activeMatchedNode.id === node.id)
    },
    isPathLink (link) {
      return isIndicatorMindMapPathLink(link, this.selectedPathIds)
    },
    startPan (event) {
      if (!this.rootNode || event.button !== 0) return
      this.isPanning = true
      this.panStart = {
        x: event.clientX,
        y: event.clientY,
        panX: this.pan.x,
        panY: this.pan.y
      }
    },
    handlePan (event) {
      if (!this.isPanning) return
      this.pan = {
        x: this.panStart.panX + event.clientX - this.panStart.x,
        y: this.panStart.panY + event.clientY - this.panStart.y
      }
    },
    stopPan () {
      this.isPanning = false
    },
    handleWheel (event) {
      const nextScale = this.scale + (event.deltaY > 0 ? -0.06 : 0.06)
      this.scale = this.clampScale(nextScale)
    },
    zoomIn () {
      this.scale = this.clampScale(this.scale + 0.1)
    },
    zoomOut () {
      this.scale = this.clampScale(this.scale - 0.1)
    },
    clampScale (value) {
      return Math.min(1.55, Math.max(0.58, Number(value.toFixed(2))))
    },
    centerRoot () {
      this.centerGraph()
    },
    resetView () {
      this.centerRoot()
    },
    centerGraph () {
      const nodes = this.graph && this.graph.nodes ? this.graph.nodes : []
      if (!nodes.length) {
        this.scale = 1
        this.pan = { x: 42, y: 42 }
        return
      }

      const bounds = nodes.reduce((box, item) => {
        return {
          minX: Math.min(box.minX, item.x),
          minY: Math.min(box.minY, item.y),
          maxX: Math.max(box.maxX, item.x + this.nodeWidth),
          maxY: Math.max(box.maxY, item.y + this.nodeHeight)
        }
      }, {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      })

      this.scale = 1
      this.pan = {
        x: this.canvasWidth / 2 - (bounds.minX + bounds.maxX) / 2,
        y: this.canvasHeight / 2 - (bounds.minY + bounds.maxY) / 2
      }
    },
    chooseImportFile () {
      if (this.importing || !this.$refs.importInput) return
      this.$refs.importInput.click()
    },
    handleImportFileChange (event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      this.importIndicatorFile(file)
    },
    async importIndicatorFile (file) {
      if (!file) return

      const validation = validateTemplateFile(file, {
        extensions: ['xls', 'xlsx'],
        maxSize: 10
      })
      if (!validation.valid) {
        this.$message.warning(validation.message)
        return
      }

      this.importing = true
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await indicatorService.importIndicatorTemplate(formData, {
          mock: this.mockEnabled
        })
        const result = normalizeIndicatorImportResult(response)
        if (result.failCount > 0) {
          this.$message.warning(result.message || '导入完成，存在错误明细')
          return
        }

        this.$message.success('指标导入成功，已覆盖当前数据')
        await this.loadTree()
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error, '指标导入失败'))
      } finally {
        this.importing = false
      }
    },
    handleEdit () {
      if (!this.selectedNode) return
      if (!this.isSelectedLeaf) {
        this.$message.warning('仅支持编辑叶子节点内容。')
        return
      }
      this.editForm = createIndicatorLeafEditForm(this.selectedNode)
      this.editDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.editForm) this.$refs.editForm.clearValidate()
      })
    },
    submitLeafEdit () {
      this.$refs.editForm.validate(async valid => {
        if (!valid) return
        this.editSaving = true
        try {
          const payload = {
            id: this.editForm.id,
            name: this.editForm.name,
            weight: this.editForm.weight,
            description: this.editForm.description
          }
          const response = await indicatorService.updateIndicatorLeaf(payload, { mock: this.mockEnabled })
          this.treeData = applyIndicatorLeafEdit(this.treeData, (response && response.record) || payload)
          this.editDialogVisible = false
          this.$message.success((response && response.message) || '叶子节点已更新')
        } catch (error) {
          this.$message.error(this.resolveErrorMessage(error, '保存叶子节点失败'))
        } finally {
          this.editSaving = false
        }
      })
    },
    resolveErrorMessage
  }
}
</script>

<style scoped>
.indicator-mind-map__file-input {
  display: none;
}

.indicator-mind-map.ultra-theme.ul-feature-page {
  --indicator-action-hover-bg: var(--ul-control-hover-bg, rgba(121, 83, 77, .08));
  --indicator-action-active-bg: var(--ul-control-active-bg, rgba(121, 83, 77, .13));
  width: 100%;
  min-width: 0;
  padding: 12px;
  overflow: auto;
  box-sizing: border-box;
}

.indicator-mind-map .indicator-mind-map__shell.ul-feature-surface {
  display: grid;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  gap: 8px;
  min-height: calc(100vh - 72px);
  padding: 12px 14px 14px;
  border-radius: 22px;
  animation: mind-map-enter .36s ease both;
}

.indicator-mind-map .indicator-mind-map__toolbar.ul-feature-header {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  gap: 12px;
  align-items: end;
  margin: 0;
  margin-bottom: 0;
}

.indicator-mind-map .indicator-mind-map__title.ul-feature-headline {
  min-width: 0;
  max-width: none;
}

.indicator-mind-map__eyebrow {
  display: block;
  margin-bottom: 3px;
  color: var(--ul-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
}

.indicator-mind-map__title h1 {
  margin: 0;
  color: var(--ul-text);
  font-size: 26px;
  font-weight: 950;
  line-height: 1.12;
}

.indicator-mind-map__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 760px;
}

.indicator-mind-map__status span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border: 1px solid var(--ul-line);
  border-radius: 999px;
  background: #fff;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 850;
}

.indicator-mind-map__controls {
  display: grid;
  grid-template-columns: 230px minmax(260px, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid var(--ul-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, .84);
}

.indicator-mind-map__control-group {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.indicator-mind-map__control-group--root {
  width: 100%;
}

.indicator-mind-map__control-group--root >>> .el-select {
  width: 100%;
}

.indicator-mind-map__control-group--search {
  min-width: 0;
  padding-left: 12px;
  border-left: 1px solid var(--ul-line);
}

.indicator-mind-map__control-group--actions {
  margin-left: auto;
  padding-left: 12px;
  border-left: 1px solid var(--ul-line);
  white-space: nowrap;
}

.indicator-mind-map__search {
  width: clamp(200px, 20vw, 310px);
}

.indicator-mind-map__controls >>> .el-input__inner {
  height: 34px;
  border-color: var(--ul-line);
  border-radius: 18px;
  color: var(--ul-text);
  font-weight: 760;
  transition: border-color .18s ease, box-shadow .18s ease, color .18s ease;
}

.indicator-mind-map__controls >>> .el-input__inner::placeholder {
  color: rgba(100, 116, 139, .52);
}

.indicator-mind-map__search >>> .el-input__inner {
  padding-left: 24px;
}

.indicator-mind-map__search >>> .el-input__suffix {
  right: 14px;
}

.indicator-mind-map__controls >>> .el-input__inner:focus,
.indicator-mind-map__controls >>> .el-select .el-input.is-focus .el-input__inner,
.indicator-mind-map__controls >>> .el-select .el-input__inner:focus {
  border-color: var(--ul-primary);
  box-shadow: var(--ul-button-focus-shadow);
}

.indicator-mind-map__controls >>> .el-select .el-input__inner:hover,
.indicator-mind-map__controls >>> .el-input__inner:hover {
  border-color: var(--ul-primary);
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper {
  overflow: hidden;
  margin-top: 8px;
  border: 1px solid var(--ul-line);
  border-radius: 18px;
  box-shadow: 0 18px 46px rgba(15, 23, 42, .12);
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .popper__arrow {
  border-bottom-color: var(--ul-line);
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .el-select-dropdown__list {
  padding: 8px;
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .el-select-dropdown__item {
  height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 850;
  line-height: 34px;
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .el-select-dropdown__item.hover,
.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .el-select-dropdown__item:hover {
  background: var(--indicator-action-hover-bg);
  color: var(--ul-primary);
}

.indicator-mind-map__control-group--root >>> .indicator-mind-map__select-popper .el-select-dropdown__item.selected {
  background: rgba(15, 23, 42, .08);
  color: var(--ul-text);
  font-weight: 950;
}

.indicator-mind-map__match-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(248, 250, 252, .96);
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  transition: color .18s ease, background .18s ease, opacity .18s ease;
}

.indicator-mind-map__match-count.is-idle {
  opacity: .42;
}

.indicator-mind-map__match-count.is-empty {
  background: rgba(248, 250, 252, .92);
  color: #94a3b8;
}

.indicator-mind-map__controls >>> .el-button + .el-button {
  margin-left: 0;
}

.indicator-mind-map__controls >>> .el-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-color: var(--ul-line);
  color: var(--ul-text);
  font-weight: 900;
  transition: border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.indicator-mind-map__controls >>> .el-button.is-circle {
  width: 34px;
  padding: 0;
}

.indicator-mind-map__controls >>> .el-button:not(.is-disabled):not(.el-button--primary):not(.el-button--info):hover,
.indicator-mind-map__controls >>> .el-button:not(.is-disabled):not(.el-button--primary):not(.el-button--info):focus {
  border-color: var(--ul-primary);
  background: var(--indicator-action-hover-bg);
  color: var(--ul-primary);
  box-shadow: var(--ul-button-focus-shadow);
}

.indicator-mind-map__controls >>> .el-button:not(.is-disabled):not(.el-button--primary):not(.el-button--info):active {
  background: var(--indicator-action-active-bg);
  color: var(--ul-primary);
  transform: translateY(1px);
}

.indicator-mind-map__controls >>> .el-button--primary {
  border-color: var(--ul-text);
  background: var(--ul-text);
  color: #fff;
}

.indicator-mind-map__controls >>> .el-button--primary:not(.is-disabled):hover,
.indicator-mind-map__controls >>> .el-button--primary:not(.is-disabled):focus {
  border-color: var(--ul-primary);
  background: var(--ul-primary);
  color: var(--ul-primary-contrast, #fff);
  box-shadow: var(--ul-button-focus-shadow);
}

.indicator-mind-map__action-cluster {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.indicator-mind-map__action-cluster + .indicator-mind-map__action-cluster {
  position: relative;
  margin-left: 6px;
  padding-left: 14px;
}

.indicator-mind-map__action-cluster + .indicator-mind-map__action-cluster::before {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 1px;
  background: var(--ul-line);
  content: '';
}

.indicator-mind-map__action-cluster--draft {
  animation: mind-map-toolbar-reveal .16s ease both;
}

.indicator-mind-map__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 232px;
  gap: 8px;
  min-height: calc(100vh - 176px);
  transition: grid-template-columns .22s ease;
}

.indicator-mind-map__workspace.is-inspector-collapsed {
  grid-template-columns: minmax(0, 1fr) 44px;
}

.indicator-mind-map__canvas {
  position: relative;
  min-height: calc(100vh - 176px);
  overflow: hidden;
  border: 1px solid var(--ul-line);
  border-radius: 12px;
  background:
    linear-gradient(rgba(148, 163, 184, .1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, .1) 1px, transparent 1px),
    linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  background-size: 32px 32px, 32px 32px, auto;
  cursor: grab;
}

.indicator-mind-map__canvas.is-panning {
  cursor: grabbing;
}

.indicator-mind-map__svg {
  display: block;
  width: 100%;
  height: calc(100vh - 176px);
  min-height: 700px;
}

.indicator-mind-map__link {
  fill: none;
  opacity: .9;
  pointer-events: none;
  transition: opacity .18s ease, filter .18s ease;
}

.indicator-mind-map__link.is-muted {
  opacity: .22;
}

.indicator-mind-map__link.is-active {
  opacity: 1;
  filter: drop-shadow(0 8px 12px rgba(15, 23, 42, .18));
}

.indicator-mind-map__node-frame {
  width: 100%;
  height: 100%;
  padding: 36px;
  box-sizing: border-box;
}

.indicator-mind-map__node {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 13px 15px;
  border: 1px solid rgba(203, 213, 225, .92);
  border-radius: 18px;
  background: rgba(255, 255, 255, .96);
  color: var(--ul-text);
  box-shadow: 0 10px 22px rgba(15, 23, 42, .07);
  cursor: pointer;
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.indicator-mind-map__node.has-children {
  padding-right: 44px;
}

.indicator-mind-map__node.is-maintenance-mode {
  cursor: grab;
}

.indicator-mind-map__node.is-maintenance-mode:active {
  cursor: grabbing;
}

.indicator-mind-map__node.is-drag-source {
  border-style: dashed;
  border-color: var(--ul-primary);
  opacity: .64;
  transform: scale(.985);
}

.indicator-mind-map__node.is-drop-target:not(.is-selected) {
  border-color: var(--ul-primary);
  background: var(--indicator-action-hover-bg);
  box-shadow: var(--ul-button-focus-shadow), 0 22px 38px rgba(15, 23, 42, .14);
}

.indicator-mind-map__node.is-drop-before:not(.is-selected) {
  box-shadow:
    inset 0 4px 0 0 var(--ul-primary),
    var(--ul-button-focus-shadow),
    0 22px 38px rgba(15, 23, 42, .14);
}

.indicator-mind-map__node.is-drop-after:not(.is-selected) {
  box-shadow:
    inset 0 -4px 0 0 var(--ul-primary),
    var(--ul-button-focus-shadow),
    0 22px 38px rgba(15, 23, 42, .14);
}

.indicator-mind-map__node.is-drop-invalid:not(.is-selected) {
  border-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, .16), 0 18px 32px rgba(245, 158, 11, .14);
}

.indicator-mind-map__node:hover,
.indicator-mind-map__node.is-selected {
  transform: translateY(-2px);
  border-color: var(--ul-primary);
  background: #ffffff;
  color: var(--ul-text);
  box-shadow: 0 18px 34px rgba(15, 23, 42, .14);
}

.indicator-mind-map__node.is-selected {
  background: #0f172a;
  color: #fff;
}

.indicator-mind-map__node.is-matched:not(.is-selected) {
  border-color: var(--ul-primary);
  background: var(--indicator-action-hover-bg);
  box-shadow: var(--ul-button-focus-shadow), 0 18px 34px rgba(15, 23, 42, .12);
}

.indicator-mind-map__node.is-active-match:not(.is-selected) {
  border-color: var(--ul-primary);
  background: var(--indicator-action-hover-bg);
  box-shadow: var(--ul-button-focus-shadow), 0 20px 38px rgba(15, 23, 42, .14);
}

.indicator-mind-map__node-meta {
  display: block;
  font-size: 12px;
  font-weight: 800;
}

.indicator-mind-map__node strong {
  display: block;
  overflow: hidden;
  color: inherit;
  font-size: 15px;
  font-weight: 950;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-mind-map__node-meta {
  margin-top: 7px;
  color: inherit;
  opacity: .62;
}

.indicator-mind-map__node-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid currentColor;
  border-radius: 999px;
  color: inherit;
  font-size: 16px;
  font-weight: 950;
  line-height: 1;
  opacity: .74;
}

.indicator-mind-map__node-toggle:hover {
  opacity: 1;
}

.indicator-mind-map__zoom {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--ul-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-mind-map__zoom button {
  width: 36px;
  height: 34px;
  border: 0;
  background: transparent;
  color: var(--ul-text);
  cursor: pointer;
  font-size: 18px;
  font-weight: 900;
}

.indicator-mind-map__zoom span {
  min-width: 56px;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}

.indicator-mind-map__state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ul-muted);
  font-size: 15px;
  font-weight: 800;
}

.indicator-mind-map__state i {
  color: var(--ul-text);
  font-size: 30px;
}

.indicator-mind-map__search-empty {
  position: absolute;
  left: 50%;
  top: 84px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--ul-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, .92);
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 900;
  box-shadow: var(--ul-shadow-sm);
  transform: translateX(-50%);
  pointer-events: none;
}

.indicator-mind-map__maintain-hint {
  position: absolute;
  left: 18px;
  top: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 132px);
  padding: 10px 14px;
  border: 1px solid var(--ul-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  color: var(--ul-primary);
  font-size: 12px;
  font-weight: 900;
  box-shadow: var(--ul-shadow-sm);
}

.indicator-mind-map__maintain-hint.is-warning {
  border-color: rgba(245, 158, 11, .24);
  background: rgba(255, 251, 235, .96);
  color: #b45309;
}

.indicator-mind-map__inspector {
  position: relative;
  min-height: calc(100vh - 176px);
  overflow: hidden;
  padding: 12px;
  border: 1px solid rgba(203, 213, 225, .82);
  border-radius: 12px;
  background: rgba(255, 255, 255, .72);
  transition: padding .22s ease, background .22s ease;
}

.indicator-mind-map__inspector.is-collapsed {
  padding: 10px 6px;
  background: rgba(255, 255, 255, .68);
}

.indicator-mind-map__inspector-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--ul-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  color: var(--ul-muted);
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.indicator-mind-map__inspector-toggle:hover {
  border-color: var(--ul-primary);
  background: var(--indicator-action-hover-bg);
  color: var(--ul-primary);
  box-shadow: var(--ul-button-focus-shadow);
  transform: translateY(-1px);
}

.indicator-mind-map__inspector-rail {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 208px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ul-muted);
}

.indicator-mind-map__inspector-rail span {
  writing-mode: vertical-rl;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: .12em;
}

.indicator-mind-map__inspector-rail strong {
  color: var(--ul-text);
  font-size: 12px;
  font-weight: 950;
}

.indicator-mind-map__panel-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding-right: 38px;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.indicator-mind-map__panel-head span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-mind-map__panel-head em {
  overflow: hidden;
  max-width: 72px;
  color: var(--ul-text);
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-mind-map__maintain-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ul-line);
  border-radius: 14px;
  background: var(--indicator-action-hover-bg);
}

.indicator-mind-map__maintain-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.indicator-mind-map__maintain-head strong {
  color: var(--ul-text);
  font-size: 15px;
  font-weight: 900;
}

.indicator-mind-map__maintain-rules {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.indicator-mind-map__maintain-rules--summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.indicator-mind-map__maintain-rules span,
.indicator-mind-map__maintain-log {
  display: block;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .92);
  color: var(--ul-text);
  font-size: 12px;
  font-weight: 800;
}

.indicator-mind-map__maintain-log {
  margin-top: 10px;
  border: 1px dashed var(--ul-line-strong);
}

.indicator-mind-map__inspector h2 {
  margin: 12px 0 0;
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 950;
  line-height: 1.25;
}

.indicator-mind-map__description {
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.7;
}

.indicator-mind-map__facts {
  display: grid;
  gap: 4px;
  margin: 12px 0 0;
}

.indicator-mind-map__facts div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--ul-line);
}

.indicator-mind-map__facts dt {
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 800;
}

.indicator-mind-map__facts dd {
  margin: 0;
  color: var(--ul-text);
  font-size: 13px;
  font-weight: 900;
  text-align: right;
}

.indicator-mind-map__path {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ul-line);
}

.indicator-mind-map__path span {
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 900;
}

.indicator-mind-map__path p {
  margin-top: 6px;
  color: var(--ul-text);
  font-size: 12px;
  line-height: 1.65;
}

.indicator-mind-map__actions {
  margin-top: 14px;
}

.indicator-mind-map__empty-detail {
  margin-top: 24px;
  color: var(--ul-muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.8;
}

@keyframes mind-map-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mind-map-toolbar-reveal {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 1180px) {
  .indicator-mind-map__toolbar,
  .indicator-mind-map__workspace {
    grid-template-columns: 1fr;
  }

  .indicator-mind-map__status {
    justify-content: flex-start;
  }

  .indicator-mind-map__controls {
    grid-template-columns: 1fr;
  }

  .indicator-mind-map__control-group--search,
  .indicator-mind-map__control-group--actions {
    margin-left: 0;
    padding-left: 0;
    border-left: 0;
  }

  .indicator-mind-map__control-group--root {
    width: min(100%, 250px);
  }

  .indicator-mind-map__control-group--search {
    min-width: 0;
  }

  .indicator-mind-map__search {
    width: 270px;
  }

  .indicator-mind-map__control-group--actions {
    width: 100%;
  }

  .indicator-mind-map__workspace {
    display: grid;
  }
}

@media (max-width: 760px) {
  .indicator-mind-map {
    padding: 12px;
  }

  .indicator-mind-map__shell {
    padding: 16px;
    border-radius: 16px;
  }

  .indicator-mind-map__toolbar {
    gap: 10px;
  }

  .indicator-mind-map__title h1 {
    font-size: 28px;
  }

  .indicator-mind-map__status {
    gap: 6px;
  }

  .indicator-mind-map__controls {
    width: 100%;
    grid-template-columns: 1fr;
    padding: 8px;
  }

  .indicator-mind-map__control-group {
    width: 100%;
    gap: 6px;
  }

  .indicator-mind-map__control-group--search {
    flex-wrap: wrap;
  }

  .indicator-mind-map__control-group--root,
  .indicator-mind-map__control-group--search,
  .indicator-mind-map__control-group--actions {
    min-width: 0;
  }

  .indicator-mind-map__control-group--actions {
    flex-wrap: wrap;
  }

  .indicator-mind-map__action-cluster {
    flex-wrap: wrap;
  }

  .indicator-mind-map__action-cluster + .indicator-mind-map__action-cluster {
    margin-left: 0;
    padding-left: 0;
  }

  .indicator-mind-map__action-cluster + .indicator-mind-map__action-cluster::before {
    display: none;
  }

  .indicator-mind-map__controls >>> .el-select,
  .indicator-mind-map__search {
    flex: 1 1 100%;
    width: auto;
  }

  .indicator-mind-map__match-count {
    flex: 0 0 72px;
  }

  .indicator-mind-map__controls >>> .el-button {
    flex: 1 1 auto;
  }

  .indicator-mind-map__canvas,
  .indicator-mind-map__svg,
  .indicator-mind-map__inspector {
    min-height: 560px;
  }

  .indicator-mind-map__svg {
    height: 560px;
  }
}
</style>
