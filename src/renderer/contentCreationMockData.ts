import type { TopicType } from './topicPoolTypes';

export type CreationMode = 'image-text' | 'video-script' | 'wechat-article' | 'replicate';

export interface CreationModeOption {
  id: CreationMode;
  name: string;
  description: string;
  icon: string;
  output: string;
}

export interface CreationTitleOption {
  id: string;
  coverTitle?: string;
  bodyTitle?: string;
  articleTitle?: string;
}

export interface CreationFramework {
  goal: string;
  audience: string;
  viewpoint: string;
  structure: string[];
  requiredMaterials: string[];
  avoid: string[];
  length: string;
  tone: string;
}

export interface SplitPromptCard {
  id: string;
  screen: string;
  layout: string;
  copy: string;
  composition: string;
  prompt: string;
}

export const creationModeOptions: CreationModeOption[] = [
  {
    id: 'image-text',
    name: '图文内容',
    description: '把一个经营主题拆成可发布的图文内容。',
    icon: '▤',
    output: '图文成稿 + 分屏提示词',
  },
  {
    id: 'video-script',
    name: '视频脚本',
    description: '围绕真实场景，整理成有节奏的视频脚本。',
    icon: '▷',
    output: '视频脚本成稿',
  },
  {
    id: 'wechat-article',
    name: '公众号文章',
    description: '把事实、观点和案例组织成完整文章。',
    icon: '▥',
    output: '公众号文章成稿',
  },
  {
    id: 'replicate',
    name: '爆款一键复刻',
    description: '拆解参考内容结构，换成适合企业的表达。',
    icon: '↺',
    output: '复刻成稿',
  },
];

const baseTopic = '秋季轻养饮日常场景';

export function getMockFramework(mode: CreationMode, round = 0): CreationFramework {
  const suffix = round > 0 ? ` 第${round + 1}版` : '';
  const modeLabel =
    mode === 'replicate'
      ? '参考内容复刻'
      : creationModeOptions.find((item) => item.id === mode)?.name;

  return {
    goal: `让用户理解${baseTopic}，并能在一个真实生活场景里找到适合自己的轻养方式。${suffix}`,
    audience: '关注日常状态管理、希望选择更轻松健康生活方式的城市家庭用户。',
    viewpoint: `不从产品功能堆叠开始，而是从${modeLabel ?? '内容'}如何进入一天的具体时刻讲起。`,
    structure: [
      '开头：用一个秋季日常场景提出用户正在面对的小困扰。',
      '中段：结合企业知识库事实，解释选择轻养饮时应该看什么。',
      '转折：用一个可执行的小动作，把观点落到生活节奏里。',
      '结尾：给出克制的选择建议，保留用户自行判断的空间。',
    ],
    requiredMaterials: ['人设档案', '产品 FAQ', '用户案例整理'],
    avoid: ['未经确认的功效承诺', '把个案体验写成普遍结论', '过度制造焦虑或强行促销'],
    length:
      mode === 'wechat-article'
        ? '900–1200 字'
        : mode === 'video-script'
          ? '60–90 秒'
          : '6–8 屏图文',
    tone: '平实、可信、有具体场景；先讲事实，再给判断。',
  };
}

export function getMockDraft(mode: CreationMode, round = 0) {
  const version = round > 0 ? `这是第${round + 1}版整理，已根据最新优化建议调整。` : '';
  const drafts: Record<CreationMode, string> = {
    'image-text': `秋天的第一杯轻养饮，不必从复杂计划开始。

很多人一到换季，就会发现自己的生活节奏变得有点乱：早上赶时间，中午顾不上好好吃饭，晚上又想给自己留一点放松的时间。

与其把健康管理变成一张很难坚持的清单，不如先从一个固定的小场景开始。比如在早餐后、工作间隙或晚餐前，给自己留出几分钟，选择一杯口味清爽、信息透明的轻养饮。

真正适合长期坚持的方式，往往不是一次做很多，而是能自然放回每天的生活里。先看清自己的需要，再选择适合的产品和节奏。${version}`,
    'video-script': `【镜头 1｜厨房，早晨】
画面：一只手把早餐和轻养饮放到桌面上。
旁白：换季以后，很多人的状态不是突然变差，而是每天都少了一点从容。

【镜头 2｜办公桌，下午三点】
画面：关掉弹出的工作消息，拿起杯子停两分钟。
旁白：与其列一张复杂的健康计划，不如先把一个小动作放回固定时间。

【镜头 3｜产品与使用说明】
画面：展示配料与饮用建议，不做夸张特写。
旁白：看清楚产品信息，按照自己的生活节奏选择，才是更容易坚持的轻养方式。

【镜头 4｜人物出门】
旁白：从今天的一杯开始，把照顾自己放回日常。${version}`,
    'wechat-article': `# 把轻养放回每天的生活节奏

换季时，人们很容易把健康管理想象成一个需要立刻完成的大计划。其实，很多变化都可以从一个小场景开始。

## 先找到能坚持的时刻

早餐后、下午三点或晚餐前，都是可以被重新安排的生活节点。固定时刻的价值，不在于把生活变得更严格，而是让自己少做一次临时决定。

## 选择之前先看清信息

面对一款轻养产品，先了解原料、配料、饮用方式和适用场景，再判断它是否适合自己。事实透明，选择才有基础。

## 小动作也可以有长期价值

真正能留下来的健康习惯，通常不是最复杂的那一个，而是能被自然放回日常的那一个。${version}`,
    replicate: `参考内容把“秋天想要更舒服的状态”拆成了三个生活片段：早晨、工作间隙和晚餐前。

我们可以保留这种由场景推进的结构，但换成企业自己的事实表达：不承诺立刻改变，只讲清楚轻养饮如何进入真实生活，以及用户在选择前需要了解哪些信息。

最终内容会从“跟着爆款做”变成“借结构讲自己的事”，让参考内容提供方法，而不是替企业发言。${version}`,
  };

  return drafts[mode];
}

export function getMockTitleOptions(mode: CreationMode, round = 0): CreationTitleOption[] {
  const roundPrefix = round > 0 ? ` · 新一轮${round + 1}` : '';
  if (mode === 'wechat-article') {
    return [
      { id: `title-${round}-01`, articleTitle: `把轻养放回每天的生活节奏${roundPrefix}` },
      { id: `title-${round}-02`, articleTitle: '换季以后，先从一个能坚持的小动作开始' },
      { id: `title-${round}-03`, articleTitle: '健康管理不必复杂，先找到适合自己的时刻' },
      { id: `title-${round}-04`, articleTitle: '从早餐后到下午三点，轻养如何进入日常' },
      { id: `title-${round}-05`, articleTitle: '选择轻养产品前，先把这几件事看明白' },
    ];
  }

  return [
    {
      id: `title-${round}-01`,
      coverTitle: `秋天的第一杯轻养饮${roundPrefix}`,
      bodyTitle: '把轻养放回每天的生活节奏',
    },
    {
      id: `title-${round}-02`,
      coverTitle: '换季别急着做大计划',
      bodyTitle: '先找到一个能坚持的小场景',
    },
    {
      id: `title-${round}-03`,
      coverTitle: '下午三点，给自己留两分钟',
      bodyTitle: '轻养不是清单，是日常里的小动作',
    },
    {
      id: `title-${round}-04`,
      coverTitle: '一杯饮品怎么进入真实生活',
      bodyTitle: '从看清信息开始，再选择适合自己的节奏',
    },
    {
      id: `title-${round}-05`,
      coverTitle: '真正能留下来的健康习惯',
      bodyTitle: '不求复杂，只求自然地放回每天',
    },
  ];
}

export const mockSplitCards: SplitPromptCard[] = [
  {
    id: 'split-01',
    screen: '第 1 屏',
    layout: '留白桌面 + 秋季晨光，标题放在左上区域。',
    copy: '秋天的第一杯轻养饮，不必从复杂计划开始。',
    composition: '早餐桌、透明玻璃杯、暖白自然光，画面保持干净克制。',
    prompt:
      '大健康品牌生活方式摄影，秋季早餐桌，一杯清爽轻养饮，暖白自然光，留白构图，真实生活感，禁止文字水印',
  },
  {
    id: 'split-02',
    screen: '第 2 屏',
    layout: '三段日常场景横向拼接，突出时间变化。',
    copy: '早上赶时间，中午顾不上，晚上又想留一点放松。',
    composition: '厨房、办公桌、晚餐前的三个小场景，人物只呈现动作不露脸。',
    prompt:
      '三联画生活方式摄影，厨房早餐、办公室下午、晚餐前片段，低饱和蓝灰与自然木色，真实克制，无品牌文字',
  },
  {
    id: 'split-03',
    screen: '第 3 屏',
    layout: '居中动作特写，四周保留说明文字空间。',
    copy: '先从一个固定的小场景开始。',
    composition: '手部把杯子放到办公桌边，旁边有便签与电脑，画面重心明确。',
    prompt:
      '办公桌日常动作特写，手部放下一杯轻养饮，电脑与便签作为背景，柔和侧光，清晰留白，真实企业内容视觉',
  },
  {
    id: 'split-04',
    screen: '第 4 屏',
    layout: '产品信息与生活物件并置，突出透明选择。',
    copy: '看清自己的需要，再选择适合的产品和节奏。',
    composition: '产品包装、配料信息卡、日历和餐桌物件平铺，避免夸张放大。',
    prompt:
      '健康产品信息平铺摄影，包装与配料说明卡、日历、餐桌物件，干净白底，企业知识内容风格，禁止虚假功效表达',
  },
  {
    id: 'split-05',
    screen: '第 5 屏',
    layout: '人物背影与城市日常，收束为轻量行动建议。',
    copy: '从今天的一杯开始，把照顾自己放回日常。',
    composition: '人物拿着杯子走向窗边，城市背景虚化，保留右侧文字区域。',
    prompt:
      '城市家庭生活方式摄影，人物背影走向窗边，手持轻养饮，城市背景虚化，清晨自然光，克制可信，留白构图',
  },
];

export function getTopicTypeLabel(type: TopicType | '') {
  if (type === 'viral') return '爆款';
  if (type === 'hotspot') return '热点';
  if (type === 'inspiration') return '灵感';
  return '未选择';
}
