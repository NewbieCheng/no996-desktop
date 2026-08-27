import type { BrainDocument, BrainFolder } from './enterpriseBrainTypes';

export const initialBrainFolders: BrainFolder[] = [
  { id: 'company', name: '企业资料库', parentId: null },
  { id: 'content', name: '内容创作库', parentId: null },
  { id: 'founder', name: '创始人 IP', parentId: 'content' },
  { id: 'persona', name: '人设档案', parentId: 'founder' },
  { id: 'sales-language', name: '卖货语言', parentId: 'founder' },
  { id: 'voice-samples', name: '声纹样本', parentId: 'founder' },
  { id: 'experience', name: '经历素材', parentId: 'founder' },
  { id: 'brand', name: '品牌 IP', parentId: 'content' },
  { id: 'brand-profile', name: '品牌账号与人设', parentId: 'brand' },
  { id: 'visual-standard', name: '视觉标准库', parentId: 'brand' },
  { id: 'brand-language', name: '品牌语言风格', parentId: 'brand' },
  { id: 'business-intro', name: '业务介绍', parentId: 'brand' },
  { id: 'assets', name: '素材资产库', parentId: null },
  { id: 'user-cases', name: '用户案例', parentId: 'assets' },
  { id: 'user-testimonials', name: '用户证言', parentId: 'assets' },
  { id: 'marketing', name: '营销话术库', parentId: null },
  { id: 'product-faq', name: '产品 FAQ', parentId: 'marketing' },
  { id: 'sales-scripts', name: '销售话术库', parentId: 'marketing' },
];

export const initialBrainDocuments: BrainDocument[] = [
  {
    id: 'founder-persona-doc',
    folderId: 'founder',
    title: '人设档案',
    fileName: '人设档案.md',
    kind: 'markdown',
    updatedAt: '今天 10:20',
    content: `## 基础信息

澄心健康创始人，长期参与营养产品研发和用户健康管理服务。表达重点是把真实经验讲清楚，让用户知道每个健康建议为什么值得信任。

## 内容方向

- 讲清产品事实和使用场景
- 记录经营过程中的真实判断
- 用平实语言回答用户疑问

> 先把事实讲明白，再谈观点和方法。

---

## 表达边界

不夸大功效，不把未经确认的内容当成产品事实。`,
  },
  {
    id: 'founder-sales-doc',
    folderId: 'founder',
    title: '卖货语言',
    fileName: '卖货语言.md',
    kind: 'markdown',
    updatedAt: '昨天 18:40',
    content: `## 语言方向

把产品特点翻译成用户能理解的具体体验，少用空泛形容词，多说使用场景。

## 常用句式

- 先说用户正在面对的问题
- 再说明产品能提供的具体帮助
- 最后给出适合的选择建议`,
  },
  {
    id: 'persona-template-doc',
    folderId: 'persona',
    title: '人设档案模板',
    fileName: '人设档案模板.md',
    kind: 'markdown',
    updatedAt: '8月20日',
    content: `## 一句话定位

用一句话说明这个角色是谁，长期为谁解决什么问题。

## 可持续素材

- 工作经历
- 产品判断
- 用户故事`,
  },
  {
    id: 'brand-profile-doc',
    folderId: 'brand',
    title: '品牌账号与人设',
    fileName: '品牌账号与人设.md',
    kind: 'markdown',
    updatedAt: '8月19日',
    content: `品牌账号负责稳定呈现营养产品事实、健康生活方式和用户关系。语气保持可信、克制、有人情味。

## 内容重点

- 产品资料
- 用户反馈
- 日常经营记录`,
  },
  {
    id: 'user-case-doc',
    folderId: 'user-cases',
    title: '用户案例整理',
    fileName: '用户案例整理.md',
    kind: 'markdown',
    updatedAt: '8月18日',
    content: `## 案例记录方式

记录用户背景、实际场景、选择原因和使用后的反馈。未经确认的内容不写入正式案例。

> 用户原话优先保留原意，编辑只做必要整理。`,
  },
  {
    id: 'product-faq-doc',
    folderId: 'product-faq',
    title: '产品 FAQ',
    fileName: '产品 FAQ.md',
    kind: 'markdown',
    updatedAt: '8月17日',
    content: `## 如何选择适合自己的产品

先了解作息、饮食和运动场景，再结合营养需求和预算选择。需要时可以把具体情况告诉健康顾问。

## 如何保存

按照产品包装和说明进行保存，开封后在建议周期内使用。`,
  },
  {
    id: 'asset-contract',
    folderId: 'user-testimonials',
    title: '用户证言清单',
    fileName: '用户证言清单.xlsx',
    kind: 'file',
    updatedAt: '8月16日',
    content: '',
  },
];
