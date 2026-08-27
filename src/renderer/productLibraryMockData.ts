import type { ProductBaseInfo, ProductRecord } from './productLibraryTypes';

export const productOptionalFieldDefinitions: Array<{
  key: keyof ProductBaseInfo;
  label: string;
  multiline?: boolean;
}> = [
  { key: 'rawMaterial', label: '原料形态' },
  { key: 'packaging', label: '包装形式' },
  { key: 'shipping', label: '发货方式' },
  { key: 'storage', label: '储存方式' },
  { key: 'afterSales', label: '售后规则' },
  { key: 'selectionStandard', label: '选品标准' },
  { key: 'founderTrace', label: '创始人 / 老板溯源素材', multiline: true },
  { key: 'recommendedCombo', label: '推荐组合' },
  { key: 'tutorial', label: '常用教程', multiline: true },
  { key: 'exclusiveFormula', label: '独家配方' },
  { key: 'knownSellingPoint', label: '已知卖点', multiline: true },
  { key: 'otherMaterials', label: '其他产品资料', multiline: true },
];

export const emptyProductBaseInfo: ProductBaseInfo = {
  name: '',
  type: '',
  specPrice: '',
  origin: '',
  craft: '',
  rawMaterial: '',
  packaging: '',
  shipping: '',
  storage: '',
  afterSales: '',
  selectionStandard: '',
  founderTrace: '',
  recommendedCombo: '',
  tutorial: '',
  exclusiveFormula: '',
  knownSellingPoint: '',
  otherMaterials: '',
};

export const productLibraryMockDocuments = [
  { id: 'product-faq-doc', title: '产品 FAQ.md', folder: '企业资料库' },
  { id: 'user-case-doc', title: '用户案例整理.md', folder: '用户案例' },
  { id: 'founder-persona-doc', title: '人设档案.md', folder: '创始人 IP' },
];

export const productLibraryMockRecords: ProductRecord[] = [
  {
    id: 'product-spring-care',
    base: {
      ...emptyProductBaseInfo,
      name: '春季轻养护组合',
      type: '健康管理方案',
      specPrice: '1 盒 / ¥268',
      origin: '澄心健康合作原料基地（虚构演示）',
      craft: '分装后独立密封，按日常使用场景组合',
      rawMaterial: '植物复合原料形态',
      packaging: '独立密封组合装',
      shipping: '常温发货',
      storage: '阴凉干燥处保存',
      afterSales: '签收后可咨询使用方式',
      selectionStandard: '原料说明清晰，使用方式容易理解',
      founderTrace: '由团队长期用户访谈和日常服务记录整理。',
      recommendedCombo: '早餐后基础调整 + 下午轻量补充',
      tutorial: '先从每天一个固定场景开始，不要求一次改变全部习惯。',
      knownSellingPoint: '从用户日常状态切入，降低开始调整的门槛。',
      otherMaterials: '本页面为虚构大健康行业演示资料。',
    },
    status: 'completed',
    updatedAt: '2026-08-24',
    sourceDocumentIds: ['product-faq-doc', 'user-case-doc'],
    analysis: {
      understanding:
        '面向久坐办公人群的日常轻养护组合，重点解决用户在日常调整过程中不知道从哪里开始的问题。',
      audienceSummary: '久坐、作息不规律、希望从低门槛方式开始调整的人群。',
      coreSellingPoint: '从日常状态切入，降低用户开始行动的门槛。',
      audience: {
        userStates: ['久坐办公', '作息不规律', '想调整状态但不想一次改变太多'],
        concerns: ['是否容易开始', '使用方式是否清晰', '是否适合自己的日常节奏'],
        scenes: ['日常办公', '季节性状态调整', '从小幅度习惯改变开始的阶段'],
        selectionConcerns: ['担心方案太复杂', '希望先看懂再决定', '在意是否能放进已有生活节奏'],
        boundaries: [
          '不适用于需要专业诊断或治疗的场景。',
          '不承诺即时效果，不将有限资料扩大解释为普遍效果。',
        ],
      },
      sellingPoints: [
        {
          title: '从日常状态切入，降低用户开始行动的门槛',
          basedOn: '产品组合围绕早餐后、办公室和下午休息等日常场景进行设计。',
          whyItWorks: '用户不需要一次改变全部生活方式，可以先从较容易执行的调整开始。',
          userHelp: '降低理解和开始使用的心理成本，让第一步更具体。',
          buyingReason: '对于希望开始调整、但不想面对复杂方案的用户，这种表达更容易形成选择依据。',
          boundary: '不能将“容易开始”扩大解释为适合所有人，也不能承诺具体效果。',
        },
        {
          title: '把组合使用放回已有生活节奏',
          basedOn: '产品资料提供了按固定日常场景使用的组合说明。',
          whyItWorks: '将产品选择和已有的早餐、办公、休息动作连接起来，减少额外记忆负担。',
          userHelp: '帮助用户判断什么时候用、怎么开始，而不是只看到抽象功能。',
          buyingReason: '使用方式足够清晰时，用户更容易评估这组产品是否适合自己。',
          boundary: '具体使用仍需以当前确认的产品说明为准，不替代个体化健康建议。',
        },
        {
          title: '用克制的资料表达建立理解基础',
          basedOn: '关联企业资料保留了产品说明和用户场景记录。',
          whyItWorks: '先讲清事实和场景，再讨论价值，减少过度承诺带来的理解偏差。',
          userHelp: '让用户更容易区分产品事实、使用建议和自己的实际需求。',
          buyingReason: '信息边界清楚时，用户可以基于更具体的判断做选择。',
          boundary: '演示资料不构成医疗、诊断或治疗建议。',
        },
      ],
    },
  },
  {
    id: 'product-sedentary-nutrition',
    base: {
      ...emptyProductBaseInfo,
      name: '久坐舒缓营养组合',
      type: '营养补充产品',
      specPrice: '',
      origin: '',
      craft: '',
      rawMaterial: '复合植物原料（资料待确认）',
      packaging: '当前未提供',
      otherMaterials: '已有一份产品介绍口述，等待人工补充规格和价格。',
    },
    status: 'pending-confirmation',
    updatedAt: '2026-08-23',
    sourceDocumentIds: ['product-faq-doc'],
    analysis: null,
  },
  {
    id: 'product-evening-reset',
    base: {
      ...emptyProductBaseInfo,
      name: '晚间轻松恢复组合',
      type: '日常营养产品',
      specPrice: '2 袋 / 当前未提供',
      origin: '',
      craft: '',
      otherMaterials: '当前资料不足，无法确认完整的产地、工艺和使用边界。',
    },
    status: 'failed',
    updatedAt: '2026-08-22',
    sourceDocumentIds: ['user-case-doc'],
    analysis: null,
    failureMessage: '当前资料不足，暂时无法完成产品理解和卖点分析。',
  },
];
