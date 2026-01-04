
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
  isThinking?: boolean;
}

export interface MissionSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface SystemStatus {
  health: 'Optimal' | 'Degraded' | 'Offline';
  latency: number;
  iqLevel: number;
  gpuLoad?: number;
}
