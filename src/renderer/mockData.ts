import type { HotspotItem, RadarConfig } from './types';

export const TODAY = '2026-08-21';

export interface WeekDay {
  date: string;
  label: string;
}

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function getWeekDays(weekOffset = 0): WeekDay[] {
  const today = new Date(`${TODAY}T00:00:00Z`);
  const monday = new Date(today);
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  monday.setUTCDate(today.getUTCDate() - daysSinceMonday + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    const dateValue = date.toISOString().slice(0, 10);

    return {
      date: dateValue,
      label: `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${weekdayLabels[index]}`,
    };
  });
}

export const weekDays: WeekDay[] = getWeekDays();

export const hotspotItems: HotspotItem[] = [
  {
    id: 'hotspot-0821-01',
    date: TODAY,
    title: '年轻人开始把小城早餐店当作周末目的地',
    level: 'strong',
    score: 91,
    summary: '多地早餐老店因短视频探店走红，地方风味与慢节奏体验成为周末内容的新入口。',
    angle: '从一杯早茶看地方品牌如何把日常饮食做成可被记住的生活方式。',
    platform: '小红书热榜',
    url: 'https://www.xiaohongshu.com/explore',
    credibility: '高',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0821-02',
    date: TODAY,
    title: '博物馆夜游带动城市文化消费升温',
    level: 'strong',
    score: 89,
    summary: '夜间开放、主题展览和城市漫游正在形成新的组合，年轻用户更愿意为体验感停留。',
    angle: '借城市夜游的场景变化，聊聊一杯酒如何成为朋友相聚的记忆点。',
    platform: '微博热搜',
    url: 'https://s.weibo.com/weibo?q=%E5%8D%9A%E7%89%A9%E9%A6%86%E5%A4%9C%E6%B8%B8',
    credibility: '高',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0821-03',
    date: TODAY,
    title: '夏末家庭聚餐更偏爱小份、多味的分享方式',
    level: 'writable',
    score: 85,
    summary: '家庭聚餐从“大菜中心”转向多人分享，低负担、易搭配成为餐桌选择的关键词。',
    angle: '围绕小份佐餐和多人分享，给出一份更适合夏末晚餐的搭配建议。',
    platform: '抖音热榜',
    url: 'https://www.douyin.com/',
    credibility: '中高',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0821-04',
    date: TODAY,
    title: '地方非遗手艺进入更多年轻人的日常消费',
    level: 'writable',
    score: 82,
    summary: '传统手艺不再只出现在节庆场景，年轻消费者开始关注它背后的地域故事与使用方式。',
    angle: '从岭南酿造技艺切入，解释传统工艺为什么能留在今天的餐桌上。',
    platform: '知乎热榜',
    url: 'https://www.zhihu.com/hot',
    credibility: '中高',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0821-05',
    date: TODAY,
    title: '周末短途出行更看重“随时能停下来的地方”',
    level: 'writable',
    score: 78,
    summary: '周边游内容从景点打卡转向松弛感路线，沿途的吃饭、休息和聊天被重新看见。',
    angle: '用一条不赶时间的岭南小城路线，连接沿途餐桌与地方风味。',
    platform: '抖音热榜',
    url: 'https://www.douyin.com/',
    credibility: '中',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0821-06',
    date: TODAY,
    title: '“不扫兴”成为年轻人讨论聚会关系的新表达',
    level: 'observe',
    score: 65,
    summary: '关于聚会分寸、照顾他人感受的讨论持续出现，但内容热度和品牌关联仍需继续观察。',
    angle: '先记录真实语境，等待更稳定的消费场景后再决定是否跟进。',
    platform: '微博热搜',
    url: 'https://s.weibo.com/weibo?q=%E4%B8%8D%E6%89%AB%E5%85%B4',
    credibility: '中',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0820-01',
    date: '2026-08-20',
    title: '城市公园里的晚风市集成为夏日新去处',
    level: 'writable',
    score: 80,
    summary: '公园、市集和轻餐饮的组合，让城市夜晚多了一个适合慢慢逛、慢慢聊的场景。',
    angle: '从晚风市集的松弛氛围，聊一聊适合朋友分享的岭南风味。',
    platform: '小红书热榜',
    url: 'https://www.xiaohongshu.com/explore',
    credibility: '中高',
    addedToTopicPool: false,
  },
  {
    id: 'hotspot-0820-02',
    date: '2026-08-20',
    title: '年轻人重新发现传统凉茶铺的社交价值',
    level: 'strong',
    score: 88,
    summary: '凉茶铺从功能消费空间变成城市记忆的一部分，传统门店的故事感重新获得关注。',
    angle: '以岭南日常为背景，介绍传统酿造与熟人社交之间的自然连接。',
    platform: '知乎热榜',
    url: 'https://www.zhihu.com/hot',
    credibility: '高',
    addedToTopicPool: false,
  },
];

export const defaultRadarConfig: RadarConfig = {
  companyProfile: '澄心健康企业配置',
  region: '中国大陆',
  sources: [
    { id: 'source-xhs', name: '小红书热榜', url: 'https://www.xiaohongshu.com/explore' },
    { id: 'source-weibo', name: '微博热搜', url: 'https://s.weibo.com/weibo?q=%E7%83%AD%E6%90%9C' },
  ],
  dailyCount: 10,
};
