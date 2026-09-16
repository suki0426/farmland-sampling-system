import { mockDelay } from './utils'

const indicatorTree = [
  {
    id: 'A',
    code: 'A',
    name: '教学目标达成',
    level: 1,
    status: 'enabled',
    weight: '35%',
    owner: '教务处',
    updatedAt: '2026-04-18',
    fileCount: 12,
    scoreTaskCount: 3,
    description: '评价课程目标、毕业要求和教学目标之间的支撑关系。',
    children: [
      {
        id: 'A-01',
        code: 'A-01',
        name: '课程目标覆盖',
        level: 2,
        parentCode: 'A',
        status: 'enabled',
        weight: '18%',
        owner: '课程负责人',
        updatedAt: '2026-04-18',
        fileCount: 6,
        scoreTaskCount: 2,
        description: '检查课程目标是否覆盖培养方案和毕业要求。',
        children: [
          {
            id: 'A-01-001',
            code: 'A-01-001',
            name: '课程目标完整性',
            level: 3,
            parentCode: 'A-01',
            status: 'enabled',
            weight: '8%',
            owner: '课程负责人',
            updatedAt: '2026-04-17',
            fileCount: 4,
            scoreTaskCount: 1,
            description: '判断课程目标是否描述清晰、覆盖完整且可评价。',
            children: [
              {
                id: 'A-01-001-01',
                code: 'A-01-001-01',
                name: '目标描述可衡量',
                level: 4,
                parentCode: 'A-01-001',
                status: 'enabled',
                weight: '4%',
                owner: '教学秘书',
                updatedAt: '2026-04-16',
                fileCount: 2,
                scoreTaskCount: 1,
                description: '课程目标应具有明确行为动词和评价边界。',
                children: [
                  {
                    id: 'A-01-001-01-01',
                    code: 'A-01-001-01-01',
                    name: '动词表达规范',
                    level: 5,
                    parentCode: 'A-01-001-01',
                    status: 'enabled',
                    weight: '2%',
                    owner: '质量办',
                    updatedAt: '2026-04-15',
                    fileCount: 1,
                    scoreTaskCount: 1,
                    description: '评价目标描述中行为动词是否符合教学评价标准。'
                  }
                ]
              },
              {
                id: 'A-01-001-02',
                code: 'A-01-001-02',
                name: '目标层级匹配',
                level: 4,
                parentCode: 'A-01-001',
                status: 'warning',
                weight: '4%',
                owner: '教学秘书',
                updatedAt: '2026-04-16',
                fileCount: 2,
                scoreTaskCount: 0,
                description: '检查课程目标层级是否与课程性质和培养要求匹配。'
              }
            ]
          },
          {
            id: 'A-01-002',
            code: 'A-01-002',
            name: '毕业要求支撑',
            level: 3,
            parentCode: 'A-01',
            status: 'enabled',
            weight: '10%',
            owner: '专业负责人',
            updatedAt: '2026-04-14',
            fileCount: 5,
            scoreTaskCount: 2,
            description: '评价课程目标与毕业要求指标点之间的支撑强度。'
          }
        ]
      },
      {
        id: 'A-02',
        code: 'A-02',
        name: '教学内容匹配',
        level: 2,
        parentCode: 'A',
        status: 'enabled',
        weight: '17%',
        owner: '教研室',
        updatedAt: '2026-04-12',
        fileCount: 6,
        scoreTaskCount: 1,
        description: '评价教学内容是否支撑课程目标达成。'
      }
    ]
  },
  {
    id: 'B',
    code: 'B',
    name: '教学过程质量',
    level: 1,
    status: 'enabled',
    weight: '30%',
    owner: '质量办',
    updatedAt: '2026-04-10',
    fileCount: 9,
    scoreTaskCount: 2,
    description: '评价教学过程记录、过程性评价和实验实践环节质量。',
    children: [
      {
        id: 'B-01',
        code: 'B-01',
        name: '过程资料完整性',
        level: 2,
        parentCode: 'B',
        status: 'enabled',
        weight: '15%',
        owner: '教学秘书',
        updatedAt: '2026-04-09',
        fileCount: 5,
        scoreTaskCount: 1,
        description: '检查教学日历、教案、作业、实验记录等过程资料。'
      },
      {
        id: 'B-02',
        code: 'B-02',
        name: '评价方式合理性',
        level: 2,
        parentCode: 'B',
        status: 'enabled',
        weight: '15%',
        owner: '课程负责人',
        updatedAt: '2026-04-08',
        fileCount: 4,
        scoreTaskCount: 1,
        description: '评价平时成绩、实验成绩、期末成绩等构成是否合理。'
      }
    ]
  },
  {
    id: 'C',
    code: 'C',
    name: '持续改进机制',
    level: 1,
    status: 'disabled',
    weight: '35%',
    owner: '学院督导组',
    updatedAt: '2026-04-06',
    fileCount: 7,
    scoreTaskCount: 1,
    description: '评价课程评价结果是否被用于下一轮教学改进。',
    children: [
      {
        id: 'C-01',
        code: 'C-01',
        name: '问题闭环整改',
        level: 2,
        parentCode: 'C',
        status: 'disabled',
        weight: '20%',
        owner: '学院督导组',
        updatedAt: '2026-04-06',
        fileCount: 3,
        scoreTaskCount: 0,
        description: '检查评价问题是否形成整改措施并持续跟踪。'
      }
    ]
  }
]

let currentIndicatorTree = createImportedIndicatorTree({ name: '默认指标数据.xlsx' })

export function createMockIndicatorTree () {
  return cloneTree(currentIndicatorTree)
}

export function createMockIndicatorList () {
  return flattenMockTree(createMockIndicatorTree())
}

export function mockDownloadIndicatorTemplate () {
  return mockDelay({
    filename: 'indicator.xlsx',
    message: '模拟下载完成'
  }, 300)
}

export function mockImportIndicatorTemplate (file) {
  const result = createMockImportResult(file)
  if (!result.failCount) {
    currentIndicatorTree = createImportedIndicatorTree(file)
  }
  return mockDelay(result, 900)
}

export function mockGetIndicatorImportResult (batchNo) {
  return mockDelay({
    batchNo,
    totalCount: 24,
    successCount: 22,
    failCount: 2,
    skippedCount: 0,
    errors: createMockIndicatorErrors()
  }, 500)
}

export function mockGetIndicatorTree () {
  return mockDelay({
    list: createMockIndicatorTree()
  }, 450)
}

export function mockGetIndicatorList (params = {}) {
  const keyword = params.keyword ? String(params.keyword).trim().toLowerCase() : ''
  const status = params.status || ''
  const list = createMockIndicatorList().filter(item => {
    const matchedKeyword = !keyword || `${item.code} ${item.name}`.toLowerCase().indexOf(keyword) > -1
    const matchedStatus = !status || item.status === status
    return matchedKeyword && matchedStatus
  })

  return mockDelay({
    records: list,
    total: list.length
  }, 350)
}

export function mockSaveIndicatorOrder (payload = {}) {
  return mockDelay({
    success: true,
    message: '指标排序草稿已保存',
    rootId: payload.rootId || '',
    changedParentCount: payload.changedParentCount || 0,
    changedNodeCount: payload.changedNodeCount || 0,
    changes: payload.changes || []
  }, 320)
}

export function mockUpdateIndicatorLeaf (payload = {}) {
  const result = updateLeafNode(currentIndicatorTree, payload)
  if (!result.updated) {
    return Promise.reject(new Error(result.message || '叶子节点更新失败'))
  }

  currentIndicatorTree = result.tree
  return mockDelay({
    success: true,
    message: '叶子节点已更新',
    record: result.node
  }, 260)
}

function createMockImportResult (file) {
  const fileName = file && file.name ? file.name : ''
  const shouldFail = fileName.indexOf('fail') > -1 || fileName.indexOf('失败') > -1
  const partial = fileName.indexOf('partial') > -1 || fileName.indexOf('部分') > -1
  const errors = shouldFail || partial ? createMockIndicatorErrors() : []
  const totalCount = 22

  return {
    batchNo: `IND-${Date.now()}`,
    totalCount,
    successCount: shouldFail ? 0 : partial ? totalCount - errors.length : totalCount,
    failCount: errors.length,
    skippedCount: 0,
    errors,
    message: errors.length ? '导入完成，存在需要修正的行。' : '导入成功，已覆盖当前指标数据。'
  }
}

function createMockIndicatorErrors () {
  return [
    {
      rowNo: 8,
      indicatorCode: 'A-02-003',
      indicatorName: '课程目标覆盖',
      errorType: '父级不存在',
      errorReason: '上级指标编码 A-02 未在导入文件或系统中找到'
    },
    {
      rowNo: 15,
      indicatorCode: 'B-01-001',
      indicatorName: '实验过程记录',
      errorType: '编码重复',
      errorReason: '指标编码与第 11 行重复'
    }
  ]
}

function flattenMockTree (tree = []) {
  return tree.reduce((list, node) => {
    list.push(node)
    if (node.children && node.children.length) {
      list.push(...flattenMockTree(node.children))
    }
    return list
  }, [])
}

function cloneTree (tree = []) {
  return JSON.parse(JSON.stringify(tree || []))
}

function createImportedIndicatorTree (file) {
  const dateText = new Date().toISOString().slice(0, 10)
  const fileName = file && file.name ? file.name.replace(/\.(xls|xlsx)$/i, '') : '导入数据'

  return [
    {
      id: 'IMP-A',
      code: 'IMP-A',
      name: '导入后指标体系',
      level: 1,
      status: 'enabled',
      weight: '100%',
      owner: '演示数据',
      updatedAt: dateText,
      fileCount: 12,
      scoreTaskCount: 0,
      description: `由“${fileName}”导入并覆盖当前指标数据。`,
      children: [
        {
          id: 'IMP-A-01',
          code: 'IMP-A-01',
          name: '准备阶段',
          level: 2,
          parentCode: 'IMP-A',
          status: 'enabled',
          weight: '35%',
          owner: '教务处',
          updatedAt: dateText,
          fileCount: 5,
          scoreTaskCount: 0,
          description: '导入后的准备阶段指标。',
          children: [
            {
              id: 'IMP-A-01-001',
              code: 'IMP-A-01-001',
              name: '资料确认',
              level: 3,
              parentCode: 'IMP-A-01',
              status: 'enabled',
              weight: '20%',
              owner: '课程负责人',
              updatedAt: dateText,
              fileCount: 3,
              scoreTaskCount: 0,
              description: '确认课程资料、评价材料和支撑文件是否齐备。',
              children: [
                {
                  id: 'IMP-A-01-001-01',
                  code: 'IMP-A-01-001-01',
                  name: '文件完整性',
                  level: 4,
                  parentCode: 'IMP-A-01-001',
                  status: 'enabled',
                  weight: '12%',
                  owner: '教学秘书',
                  updatedAt: dateText,
                  fileCount: 3,
                  scoreTaskCount: 0,
                  description: '检查课程大纲、教学日历、评价材料是否完整。',
                  children: [
                    {
                      id: 'IMP-A-01-001-01-01',
                      code: 'IMP-A-01-001-01-01',
                      name: '课程大纲归档',
                      level: 5,
                      parentCode: 'IMP-A-01-001-01',
                      status: 'enabled',
                      weight: '6%',
                      owner: '教学秘书',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认课程大纲已按最新版本归档。'
                    },
                    {
                      id: 'IMP-A-01-001-01-02',
                      code: 'IMP-A-01-001-01-02',
                      name: '教学日历归档',
                      level: 5,
                      parentCode: 'IMP-A-01-001-01',
                      status: 'enabled',
                      weight: '6%',
                      owner: '教学秘书',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认教学日历已按最新授课安排归档。'
                    }
                  ]
                },
                {
                  id: 'IMP-A-01-001-02',
                  code: 'IMP-A-01-001-02',
                  name: '材料有效性',
                  level: 4,
                  parentCode: 'IMP-A-01-001',
                  status: 'enabled',
                  weight: '8%',
                  owner: '课程负责人',
                  updatedAt: dateText,
                  fileCount: 1,
                  scoreTaskCount: 0,
                  description: '核对支撑材料是否属于当前评价周期。',
                  children: [
                    {
                      id: 'IMP-A-01-001-02-01',
                      code: 'IMP-A-01-001-02-01',
                      name: '证明材料日期',
                      level: 5,
                      parentCode: 'IMP-A-01-001-02',
                      status: 'enabled',
                      weight: '4%',
                      owner: '课程负责人',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认证明材料日期与评价学期一致。'
                    }
                  ]
                }
              ]
            },
            {
              id: 'IMP-A-01-002',
              code: 'IMP-A-01-002',
              name: '目标核对',
              level: 3,
              parentCode: 'IMP-A-01',
              status: 'enabled',
              weight: '15%',
              owner: '课程负责人',
              updatedAt: dateText,
              fileCount: 2,
              scoreTaskCount: 0,
              description: '核对教学目标与阶段任务是否一致。',
              children: [
                {
                  id: 'IMP-A-01-002-01',
                  code: 'IMP-A-01-002-01',
                  name: '目标一致性',
                  level: 4,
                  parentCode: 'IMP-A-01-002',
                  status: 'enabled',
                  weight: '15%',
                  owner: '专业负责人',
                  updatedAt: dateText,
                  fileCount: 2,
                  scoreTaskCount: 0,
                  description: '检查教学目标与毕业要求、课程任务是否一致。',
                  children: [
                    {
                      id: 'IMP-A-01-002-01-01',
                      code: 'IMP-A-01-002-01-01',
                      name: '目标编码匹配',
                      level: 5,
                      parentCode: 'IMP-A-01-002-01',
                      status: 'enabled',
                      weight: '8%',
                      owner: '专业负责人',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认课程目标编码与支撑关系表一致。'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'IMP-A-02',
          code: 'IMP-A-02',
          name: '执行阶段',
          level: 2,
          parentCode: 'IMP-A',
          status: 'enabled',
          weight: '45%',
          owner: '教研室',
          updatedAt: dateText,
          fileCount: 5,
          scoreTaskCount: 0,
          description: '导入后的执行阶段指标。',
          children: [
            {
              id: 'IMP-A-02-001',
              code: 'IMP-A-02-001',
              name: '过程记录',
              level: 3,
              parentCode: 'IMP-A-02',
              status: 'enabled',
              weight: '25%',
              owner: '教学秘书',
              updatedAt: dateText,
              fileCount: 3,
              scoreTaskCount: 0,
              description: '记录教学过程中的关键活动与证据材料。',
              children: [
                {
                  id: 'IMP-A-02-001-01',
                  code: 'IMP-A-02-001-01',
                  name: '活动记录',
                  level: 4,
                  parentCode: 'IMP-A-02-001',
                  status: 'enabled',
                  weight: '15%',
                  owner: '任课教师',
                  updatedAt: dateText,
                  fileCount: 2,
                  scoreTaskCount: 0,
                  description: '汇总课堂、实验和作业相关过程记录。',
                  children: [
                    {
                      id: 'IMP-A-02-001-01-01',
                      code: 'IMP-A-02-001-01-01',
                      name: '课堂签到核验',
                      level: 5,
                      parentCode: 'IMP-A-02-001-01',
                      status: 'enabled',
                      weight: '7%',
                      owner: '任课教师',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '核验课堂签到记录是否覆盖关键教学周。'
                    }
                  ]
                }
              ]
            },
            {
              id: 'IMP-A-02-002',
              code: 'IMP-A-02-002',
              name: '结果评价',
              level: 3,
              parentCode: 'IMP-A-02',
              status: 'warning',
              weight: '20%',
              owner: '质量办',
              updatedAt: dateText,
              fileCount: 2,
              scoreTaskCount: 0,
              description: '评价执行结果与目标达成情况。',
              children: [
                {
                  id: 'IMP-A-02-002-01',
                  code: 'IMP-A-02-002-01',
                  name: '达成度计算',
                  level: 4,
                  parentCode: 'IMP-A-02-002',
                  status: 'warning',
                  weight: '20%',
                  owner: '质量办',
                  updatedAt: dateText,
                  fileCount: 2,
                  scoreTaskCount: 0,
                  description: '核对成绩数据与目标达成度计算口径。',
                  children: [
                    {
                      id: 'IMP-A-02-002-01-01',
                      code: 'IMP-A-02-002-01-01',
                      name: '成绩映射校验',
                      level: 5,
                      parentCode: 'IMP-A-02-002-01',
                      status: 'warning',
                      weight: '10%',
                      owner: '质量办',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认成绩项与课程目标映射关系正确。'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'IMP-A-03',
          code: 'IMP-A-03',
          name: '改进阶段',
          level: 2,
          parentCode: 'IMP-A',
          status: 'enabled',
          weight: '20%',
          owner: '学院督导组',
          updatedAt: dateText,
          fileCount: 2,
          scoreTaskCount: 0,
          description: '导入后的改进阶段指标。',
          children: [
            {
              id: 'IMP-A-03-001',
              code: 'IMP-A-03-001',
              name: '闭环整改',
              level: 3,
              parentCode: 'IMP-A-03',
              status: 'enabled',
              weight: '20%',
              owner: '学院督导组',
              updatedAt: dateText,
              fileCount: 2,
              scoreTaskCount: 0,
              description: '形成整改动作并跟踪下一轮执行效果。',
              children: [
                {
                  id: 'IMP-A-03-001-01',
                  code: 'IMP-A-03-001-01',
                  name: '改进跟踪',
                  level: 4,
                  parentCode: 'IMP-A-03-001',
                  status: 'enabled',
                  weight: '20%',
                  owner: '学院督导组',
                  updatedAt: dateText,
                  fileCount: 2,
                  scoreTaskCount: 0,
                  description: '跟踪问题整改责任人、完成时间和改进证据。',
                  children: [
                    {
                      id: 'IMP-A-03-001-01-01',
                      code: 'IMP-A-03-001-01-01',
                      name: '整改证据归档',
                      level: 5,
                      parentCode: 'IMP-A-03-001-01',
                      status: 'enabled',
                      weight: '10%',
                      owner: '学院督导组',
                      updatedAt: dateText,
                      fileCount: 1,
                      scoreTaskCount: 0,
                      description: '确认整改证据已归档并可追溯到具体问题。'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

function updateLeafNode (tree = [], payload = {}) {
  const draft = cloneTree(tree)
  let updatedNode = null
  const walk = nodes => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.id === payload.id) {
        if (node.children && node.children.length) {
          return { updated: false, message: '仅支持编辑叶子节点内容' }
        }
        nodes[i] = {
          ...node,
          name: payload.name,
          description: payload.description,
          weight: payload.weight,
          status: payload.status || node.status,
          updatedAt: new Date().toISOString().slice(0, 10)
        }
        updatedNode = nodes[i]
        return { updated: true }
      }
      if (node.children && node.children.length) {
        const result = walk(node.children)
        if (result.updated || result.message) return result
      }
    }
    return { updated: false }
  }

  const result = walk(draft)
  if (!result.updated) {
    return {
      updated: false,
      message: result.message || '未找到需要更新的叶子节点'
    }
  }

  return {
    updated: true,
    tree: draft,
    node: updatedNode
  }
}
