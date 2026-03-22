/**
 * Default pre-trip tasks template
 * Tasks are defined with suggested due dates relative to trip start date
 */
export interface DefaultTask {
  title: string;
  category: string;
  daysBeforeStart: number;
  priority: number;
}

export const DEFAULT_TRIP_TASKS: DefaultTask[] = [
  {
    title: 'Book flights',
    category: 'Logistics',
    daysBeforeStart: 60,
    priority: 1,
  },
  {
    title: 'Book accommodation',
    category: 'Logistics',
    daysBeforeStart: 45,
    priority: 1,
  },
  {
    title: 'Check visa requirements',
    category: 'Documents',
    daysBeforeStart: 45,
    priority: 1,
  },
  {
    title: 'Buy travel insurance',
    category: 'Documents',
    daysBeforeStart: 30,
    priority: 2,
  },
  {
    title: 'Arrange transport',
    category: 'Logistics',
    daysBeforeStart: 30,
    priority: 2,
  },
  {
    title: 'Exchange currency',
    category: 'Money',
    daysBeforeStart: 14,
    priority: 2,
  },
  {
    title: 'Buy eSIM',
    category: 'Communication',
    daysBeforeStart: 7,
    priority: 3,
  },
  {
    title: 'Prepare travel documents',
    category: 'Documents',
    daysBeforeStart: 5,
    priority: 2,
  },
];
