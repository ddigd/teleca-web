import type { Collection } from "./types";
import { getImageUrl } from "./supabase";

// Map DB snake_case → component camelCase
export function mapCollection(c: Collection) {
  return {
    id: c.id,
    brand: c.brand,
    title: c.title,
    description: c.description || "",
    productInfo: c.product_info || "",
    thumbnail: getImageUrl(c.thumbnail_url),
    mainImage: getImageUrl(c.main_image_url),
    cardsPerPack: c.cards_per_pack,
    packsPerBox: c.packs_per_box,
    boxesPerCase: c.boxes_per_case,
    releaseDate: c.release_date || "",
    date: c.date_label || "",
    isNew: c.is_new,
    status: c.status,
    chasingCards: (c.chasing_cards || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(cc => ({
        name: cc.name,
        desc: cc.description || "",
        ratio: cc.ratio || "",
        tag: cc.tag || "",
        tagColor: cc.tag_color || "#7C3AED",
        code: cc.code || "",
        image: getImageUrl(cc.image_url),
      })),
    checklist: (c.checklist_items || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(cl => ({
        number: cl.number || "",
        name: cl.name || "",
        rarity: cl.rarity || "",
      })),
  };
}

export type MappedCollection = ReturnType<typeof mapCollection>;
