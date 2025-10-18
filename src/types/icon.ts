export interface IconItem {
  id: string;
  name: string;
  category: string;
  svgData: string;
  thumbnail: string;
  createdAt: number;
}

export interface IconCategory {
  id: string;
  name: string;
  description?: string;
}
