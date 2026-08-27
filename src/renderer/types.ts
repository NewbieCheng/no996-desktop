export type HotspotLevel = 'strong' | 'writable' | 'observe';

export interface HotspotItem {
  id: string;
  date: string;
  title: string;
  level: HotspotLevel;
  score: number;
  summary: string;
  angle: string;
  platform: string;
  url: string;
  credibility: string;
  addedToTopicPool: boolean;
}

export interface SourcePlatform {
  id: string;
  name: string;
  url: string;
}

export interface RadarConfig {
  companyProfile: string;
  region: string;
  sources: SourcePlatform[];
  dailyCount: number;
}
