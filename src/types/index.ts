export type StrainType = "sativa" | "indica" | "hybrid";

export interface Strain {
  id: string;
  name: string;
  type: StrainType;
  thc: number;
  cbd: number;
  description: string;
  effects: string[];
  flavors: string[];
  terpenes: string[];
  genetics: {
    lineage: string;
    breeder?: string;
    parents: string[];
  };
  rating: number;
  reviewCount: number;
  color: string; // hex color for the strain card accent
}

export interface CheckIn {
  id: string;
  strainId: string;
  strain: Strain;
  rating: number;
  review: string;
  mood: string;
  photo?: string;
  createdAt: string;
  username: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  totalCheckins: number;
  uniqueStrains: number;
  memberSince: string;
  isPro: boolean;
  badges: Badge[];
  recentCheckins: CheckIn[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}
