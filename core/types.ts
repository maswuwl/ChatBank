
export enum EngineMode {
  FLASH = 'Muntasir-Flash',
  ULTRA = 'Muntasir-Ultra',
  LOCAL_X1 = 'Sovereign-Core-X1'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MessagePart {
  text?: string;
  image?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: MessagePart[];
  mode?: EngineMode;
  timestamp: number;
  sources?: GroundingSource[];
  latencyMs?: number;
  modelName?: string;
}

export interface MissionSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface EngineResult {
  text: string;
  sources?: GroundingSource[];
  meta: {
    model: string;
    mode: EngineMode;
    latencyMs: number;
  };
}

// Social Media Specific Types
export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'friend_request' | 'ai_mention';
  user: string;
  text: string;
  time: string;
  read: boolean;
}

export type ViewState = 'feed' | 'messenger' | 'notifications' | 'profile' | 'groups' | 'settings';
