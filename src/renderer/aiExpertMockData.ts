export type AiExpertCategory = 'insights' | 'content' | 'retention' | 'enterprise';

export interface AiExpert {
  id: string;
  name: string;
  category: AiExpertCategory;
  description: string;
  initialUnlocked: boolean;
}

export const aiExpertCategories: Array<{ id: AiExpertCategory; label: string }> = [
  { id: 'insights', label: '洞察中心' },
  { id: 'content', label: '内容增长' },
  { id: 'retention', label: '复购经营' },
  { id: 'enterprise', label: '企业经营' },
];

export const aiExperts: AiExpert[] = [
  {
    id: 'user-insight',
    name: '用户洞察专家',
    category: 'insights',
    description: '把用户反馈整理成可行动的需求判断。',
    initialUnlocked: false,
  },
  {
    id: 'data-report',
    name: '数据分析报告师',
    category: 'insights',
    description: '将经营数据转成清晰的分析报告。',
    initialUnlocked: true,
  },
  {
    id: 'business-diagnosis',
    name: '企业经营诊断专家',
    category: 'insights',
    description: '从经营现状中定位关键问题与改进方向。',
    initialUnlocked: false,
  },
  {
    id: 'viral-content',
    name: '爆文专家',
    category: 'content',
    description: '围绕热点和用户需求产出高传播内容。',
    initialUnlocked: true,
  },
  {
    id: 'founder-ip-content',
    name: '创始人IP内容专家',
    category: 'content',
    description: '把创始人的经历和判断写成持续内容。',
    initialUnlocked: true,
  },
  {
    id: 'product-sales-content',
    name: '产品卖货内容专家',
    category: 'content',
    description: '把产品事实翻译成自然、有说服力的卖货内容。',
    initialUnlocked: false,
  },
  {
    id: 'compliant-selling-points',
    name: '卖点合规表达专家',
    category: 'content',
    description: '提炼产品卖点并校准表达边界。',
    initialUnlocked: false,
  },
  {
    id: 'platform-risk-review',
    name: '多平台违禁词专家',
    category: 'content',
    description: '检查不同平台的表达风险与替换方式。',
    initialUnlocked: false,
  },
  {
    id: 'digital-human-script',
    name: '数字人商品口播专家',
    category: 'content',
    description: '为数字人设计清晰自然的商品口播。',
    initialUnlocked: false,
  },
  {
    id: 'product-short-film',
    name: '商品宣传短片专家',
    category: 'content',
    description: '规划商品宣传短片的结构和镜头。',
    initialUnlocked: false,
  },
  {
    id: 'product-detail-page',
    name: '商品详情页专家',
    category: 'content',
    description: '组织商品详情页的信息层级和转化表达。',
    initialUnlocked: false,
  },
  {
    id: 'ai-product-image',
    name: 'AI产品图专家',
    category: 'content',
    description: '为产品图提供适合场景的生成方案。',
    initialUnlocked: false,
  },
  {
    id: 'china-ecommerce-operations',
    name: '中国电商运营专家',
    category: 'retention',
    description: '围绕中国电商平台拆解经营动作。',
    initialUnlocked: false,
  },
  {
    id: 'sales-coach',
    name: '销售教练',
    category: 'retention',
    description: '根据具体销售场景提供对话训练和建议。',
    initialUnlocked: true,
  },
  {
    id: 'live-commerce-script',
    name: '直播话术设计大师',
    category: 'retention',
    description: '搭建直播间节奏、话术和转场结构。',
    initialUnlocked: false,
  },
  {
    id: 'contract-legal',
    name: '合同法务专家',
    category: 'enterprise',
    description: '辅助识别合同中的常见风险和沟通要点。',
    initialUnlocked: false,
  },
];

export const aiExpertStorageKey = 'no-overtime-workbench.ai-experts.unlocked.v1';

export const initialUnlockedExpertIds = aiExperts
  .filter((expert) => expert.initialUnlocked)
  .map((expert) => expert.id);
