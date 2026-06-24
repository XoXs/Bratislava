export type DayId = '2026-07-09' | '2026-07-10' | '2026-07-11' | '2026-07-12';

export type Timeslot = 'Vormittag' | 'Nachmittag' | 'Abend';

export type Priority = 'Must-have' | 'Optional' | 'Backup';

export type ReservationStatus = 'Offen' | 'Angefragt' | 'Gebucht' | 'Bezahlt';

export type Category =
  | 'Reise'
  | 'Kultur'
  | 'Bier & Bars'
  | 'Essen'
  | 'Special Activity'
  | 'Aussicht'
  | 'Nachtleben'
  | 'Backup bei Regen';

export type Activity = {
  id: string;
  title: string;
  dayId: DayId;
  timeslot: Timeslot;
  timeRange: string;
  category: Category;
  description: string;
  location: string;
  mapsUrl: string;
  costPerPerson: number;
  reservationStatus: ReservationStatus;
  notes: string;
  attendees: string[];
  likedBy: string[];
  priority: Priority;
  booked: boolean;
  favorite: boolean;
};
