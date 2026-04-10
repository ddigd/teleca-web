export interface Collection {
  id: string;
  brand: string;
  title: string;
  description: string | null;
  product_info: string | null;
  thumbnail_url: string | null;
  main_image_url: string | null;
  cards_per_pack: number;
  packs_per_box: number;
  boxes_per_case: number;
  release_date: string | null;
  date_label: string | null;
  is_new: boolean;
  status: string;
  sort_order: number; theme_primary?: string | null; theme_bg?: string | null;
  checklist_url?: string | null;
  chasing_cards?: ChasingCard[];
  checklist_items?: ChecklistItem[];
}

export interface ChasingCard {
  id: string;
  collection_id: string;
  name: string;
  description: string | null;
  ratio: string | null;
  tag: string | null;
  tag_color: string;
  code: string | null;
  image_url: string | null;
  sort_order: number; theme_primary?: string | null; theme_bg?: string | null;
}

export interface ChecklistItem {
  id: string;
  collection_id: string;
  number: string | null;
  name: string | null;
  rarity: string | null;
  sort_order: number; theme_primary?: string | null; theme_bg?: string | null;
}

export interface HeroSettings {
  id: number;
  title: string;
  subtitle: string;
  featured_id: string | null;
}
