import { TripClimate, TripType } from '../../trips/enums/trip.enums';

export interface PackingSuggestionTemplate {
  name: string;
  category: string;
  quantity: number;
}

export const PACKING_CATEGORIES = {
  Clothes: 'Clothes',
  Toiletries: 'Toiletries',
  Electronics: 'Electronics',
  Documents: 'Documents',
  Misc: 'Misc',
} as const;

/** Items always suggested regardless of climate or trip type */
const UNIVERSAL_ITEMS: PackingSuggestionTemplate[] = [
  { name: 'Passport', category: PACKING_CATEGORIES.Documents, quantity: 1 },
  {
    name: 'Travel insurance documents',
    category: PACKING_CATEGORIES.Documents,
    quantity: 1,
  },
  {
    name: 'Phone charger',
    category: PACKING_CATEGORIES.Electronics,
    quantity: 1,
  },
  { name: 'Power bank', category: PACKING_CATEGORIES.Electronics, quantity: 1 },
  { name: 'Toothbrush', category: PACKING_CATEGORIES.Toiletries, quantity: 1 },
  { name: 'Toothpaste', category: PACKING_CATEGORIES.Toiletries, quantity: 1 },
  { name: 'Deodorant', category: PACKING_CATEGORIES.Toiletries, quantity: 1 },
  { name: 'Medication', category: PACKING_CATEGORIES.Misc, quantity: 1 },
  { name: 'Reusable bag', category: PACKING_CATEGORIES.Misc, quantity: 1 },
];

/** Items added when tripDurationDays > 7 */
const LONG_TRIP_EXTRAS: PackingSuggestionTemplate[] = [
  {
    name: 'Travel laundry bag',
    category: PACKING_CATEGORIES.Misc,
    quantity: 1,
  },
  { name: 'Travel pillow', category: PACKING_CATEGORIES.Misc, quantity: 1 },
  {
    name: 'Multi-socket adapter',
    category: PACKING_CATEGORIES.Electronics,
    quantity: 1,
  },
];

const CLIMATE_ITEMS: Record<TripClimate, PackingSuggestionTemplate[]> = {
  [TripClimate.Warm]: [
    { name: 'T-shirts', category: PACKING_CATEGORIES.Clothes, quantity: 5 },
    { name: 'Shorts', category: PACKING_CATEGORIES.Clothes, quantity: 3 },
    { name: 'Swimwear', category: PACKING_CATEGORIES.Clothes, quantity: 2 },
    { name: 'Sunglasses', category: PACKING_CATEGORIES.Misc, quantity: 1 },
    {
      name: 'Sunscreen SPF50+',
      category: PACKING_CATEGORIES.Toiletries,
      quantity: 1,
    },
    { name: 'Sandals', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    { name: 'Sun hat', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    {
      name: 'Insect repellent',
      category: PACKING_CATEGORIES.Toiletries,
      quantity: 1,
    },
  ],
  [TripClimate.Cold]: [
    {
      name: 'Thermal underwear',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 3,
    },
    { name: 'Heavy jacket', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    { name: 'Warm socks', category: PACKING_CATEGORIES.Clothes, quantity: 5 },
    { name: 'Gloves', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    { name: 'Scarf', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    {
      name: 'Winter hat / beanie',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 1,
    },
    {
      name: 'Waterproof boots',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 1,
    },
    { name: 'Lip balm', category: PACKING_CATEGORIES.Toiletries, quantity: 1 },
  ],
  [TripClimate.Temperate]: [
    { name: 'T-shirts', category: PACKING_CATEGORIES.Clothes, quantity: 4 },
    {
      name: 'Light jacket / hoodie',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 1,
    },
    {
      name: 'Jeans / trousers',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 2,
    },
    { name: 'Sneakers', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    { name: 'Umbrella', category: PACKING_CATEGORIES.Misc, quantity: 1 },
  ],
  [TripClimate.Tropical]: [
    {
      name: 'Lightweight shirts',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 5,
    },
    { name: 'Shorts', category: PACKING_CATEGORIES.Clothes, quantity: 3 },
    { name: 'Swimwear', category: PACKING_CATEGORIES.Clothes, quantity: 2 },
    {
      name: 'Sunscreen SPF50+',
      category: PACKING_CATEGORIES.Toiletries,
      quantity: 1,
    },
    {
      name: 'Insect repellent',
      category: PACKING_CATEGORIES.Toiletries,
      quantity: 1,
    },
    {
      name: 'Waterproof sandals',
      category: PACKING_CATEGORIES.Clothes,
      quantity: 1,
    },
    { name: 'Rain jacket', category: PACKING_CATEGORIES.Clothes, quantity: 1 },
    {
      name: 'After-sun lotion',
      category: PACKING_CATEGORIES.Toiletries,
      quantity: 1,
    },
  ],
};

const TRIP_TYPE_EXTRAS: Partial<Record<TripType, PackingSuggestionTemplate[]>> =
  {
    [TripType.Business]: [
      {
        name: 'Business suits / formal wear',
        category: PACKING_CATEGORIES.Clothes,
        quantity: 2,
      },
      {
        name: 'Dress shoes',
        category: PACKING_CATEGORIES.Clothes,
        quantity: 1,
      },
      { name: 'Laptop', category: PACKING_CATEGORIES.Electronics, quantity: 1 },
      {
        name: 'Laptop charger',
        category: PACKING_CATEGORIES.Electronics,
        quantity: 1,
      },
      {
        name: 'Business cards',
        category: PACKING_CATEGORIES.Documents,
        quantity: 1,
      },
      {
        name: 'Notebook and pens',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
    ],
    [TripType.Adventure]: [
      {
        name: 'Hiking boots',
        category: PACKING_CATEGORIES.Clothes,
        quantity: 1,
      },
      {
        name: 'Quick-dry trousers',
        category: PACKING_CATEGORIES.Clothes,
        quantity: 2,
      },
      {
        name: 'Waterproof jacket',
        category: PACKING_CATEGORIES.Clothes,
        quantity: 1,
      },
      { name: 'First aid kit', category: PACKING_CATEGORIES.Misc, quantity: 1 },
      {
        name: 'Headlamp with batteries',
        category: PACKING_CATEGORIES.Electronics,
        quantity: 1,
      },
      { name: 'Water bottle', category: PACKING_CATEGORIES.Misc, quantity: 1 },
    ],
    [TripType.Family]: [
      {
        name: 'Baby wipes / wet wipes',
        category: PACKING_CATEGORIES.Misc,
        quantity: 2,
      },
      {
        name: 'Snacks for journey',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
      {
        name: 'Portable first aid kit',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
      {
        name: 'Travel games / activities',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
    ],
    [TripType.RoadTrip]: [
      {
        name: 'Car phone mount',
        category: PACKING_CATEGORIES.Electronics,
        quantity: 1,
      },
      {
        name: 'Car charger / inverter',
        category: PACKING_CATEGORIES.Electronics,
        quantity: 1,
      },
      {
        name: 'Snacks and drinks',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
      {
        name: 'Roadside emergency kit',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
      {
        name: 'Paper maps / atlas',
        category: PACKING_CATEGORIES.Misc,
        quantity: 1,
      },
    ],
  };

export function buildPackingSuggestions(
  tripType: TripType,
  climate: TripClimate | undefined,
  tripDurationDays: number,
): PackingSuggestionTemplate[] {
  const items: PackingSuggestionTemplate[] = [...UNIVERSAL_ITEMS];

  if (climate && CLIMATE_ITEMS[climate]) {
    items.push(...CLIMATE_ITEMS[climate]);
  }

  const typeExtras = TRIP_TYPE_EXTRAS[tripType];
  if (typeExtras) {
    items.push(...typeExtras);
  }

  if (tripDurationDays > 7) {
    items.push(...LONG_TRIP_EXTRAS);
  }

  // Deduplicate by name (e.g. both warm + adventure may add insect repellent)
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}
