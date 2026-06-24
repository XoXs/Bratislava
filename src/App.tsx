import { Activity, Category, DayId, Priority, ReservationStatus, Timeslot } from './types';
import {
  categories,
  categoryMeta,
  days,
  defaultParticipants,
  seedActivities,
  timeslots,
} from './data';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Euro,
  ExternalLink,
  GripVertical,
  Heart,
  History,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Draft = Omit<Activity, 'id' | 'booked' | 'favorite'> & { id?: string; booked?: boolean; favorite?: boolean };
type HistoryEntry = {
  id: string;
  user: string;
  action: string;
  detail: string;
  timestamp: string;
};

const storageKey = 'bratislava-trip-planner-v2';

const defaultDraft: Draft = {
  title: '',
  dayId: '2026-07-10',
  timeslot: 'Vormittag',
  timeRange: '',
  category: 'Kultur',
  description: '',
  location: '',
  mapsUrl: '',
  costPerPerson: 0,
  reservationStatus: 'Offen',
  notes: '',
  attendees: defaultParticipants,
  likedBy: [],
  priority: 'Optional',
};

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const normalizeTimeslot = (timeslot: string): Timeslot => {
  if (timeslot === 'Morgen') return 'Vormittag';
  if (timeslot === 'Mittag') return 'Nachmittag';
  if (timeslot === 'Nacht') return 'Abend';
  return timeslot as Timeslot;
};

const legacySeedActivityIds = new Set([
  'arrival',
  'first-beer',
  'castle',
  'old-town',
  'ufo',
  'bunker',
  'devin',
  'craft-beer',
  'beer-bike',
  'final-night',
]);

const normalizeActivities = (activities: Activity[], participants: string[], likedActivityTitles = new Set<string>()): Activity[] =>
  activities.map((activity) => ({
    ...activity,
    timeslot: normalizeTimeslot(activity.timeslot),
    attendees: participants,
    likedBy:
      legacySeedActivityIds.has(activity.id) && !likedActivityTitles.has(activity.title)
        ? []
        : (activity.likedBy ?? []).filter((participant) => participants.includes(participant)),
  }));

const relevantHistoryActions = new Set([
  'Planpunkt bearbeitet',
  'Planpunkt hinzugefügt',
  'Planpunkt gelöscht',
  'Planpunkt dupliziert',
  'Planpunkt verschoben',
  'Like entfernt',
  'Planpunkt geliked',
  'Buchung zurückgesetzt',
  'Als gebucht markiert',
]);

const normalizeHistory = (history: HistoryEntry[] = []): HistoryEntry[] =>
  history.filter((entry) => relevantHistoryActions.has(entry.action));

const getMapPreviewUrl = (activity: Activity) => {
  const query = activity.location || activity.title;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
};

const formatHistoryTime = (timestamp: string) =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));

const getInitials = (name: string, allNames: string[] = []) => {
  const cleanName = name.trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const defaultInitials =
    words.length > 1
      ? `${words[0][0] ?? ''}${words[1][0] ?? ''}`
      : cleanName.slice(0, 2);
  const normalizedDefault = defaultInitials.toLocaleLowerCase('de-DE');
  const conflictNames = allNames.filter(
    (otherName) => otherName.trim().slice(0, 2).toLocaleLowerCase('de-DE') === normalizedDefault,
  );

  if (conflictNames.length <= 1 || cleanName.length < 2) {
    return defaultInitials.toLocaleUpperCase('de-DE');
  }

  const maxLength = Math.max(...conflictNames.map((conflictName) => conflictName.length));
  const differingIndex =
    Array.from({ length: maxLength }).findIndex((_, index) => {
      const chars = new Set(conflictNames.map((conflictName) => conflictName[index]?.toLocaleLowerCase('de-DE') ?? ''));
      return chars.size > 1;
    }) || 1;

  return `${cleanName[0]}${cleanName[differingIndex] ?? cleanName[1]}`.toLocaleUpperCase('de-DE');
};

export function App() {
  const stored = readStoredState();
  const storedHistory = normalizeHistory(stored?.history);
  const likedActivityTitles = new Set(
    storedHistory
      .filter((entry) => entry.action === 'Planpunkt geliked' || entry.action === 'Like entfernt')
      .map((entry) => entry.detail),
  );
  const [currentUser, setCurrentUser] = useState<string | null>(stored?.currentUser ?? null);
  const [participants, setParticipants] = useState<string[]>(stored?.participants ?? defaultParticipants);
  const [activities, setActivities] = useState<Activity[]>(normalizeActivities(stored?.activities ?? seedActivities, stored?.participants ?? defaultParticipants, likedActivityTitles));
  const [history, setHistory] = useState<HistoryEntry[]>(storedHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ currentUser, participants, activities, history }));
  }, [currentUser, participants, activities, history]);

  const bookedCount = activities.filter((activity) => activity.booked).length;
  const likeCount = activities.reduce((sum, activity) => sum + activity.likedBy.length, 0);
  const estimatedTotal = activities.reduce((sum, activity) => sum + activity.costPerPerson * participants.length, 0);

  const recordHistory = (action: string, detail: string, user = currentUser ?? 'System') => {
    setHistory((current) => [
      {
        id: uid(),
        user,
        action,
        detail,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 200));
  };

  const selectUser = (name: string) => {
    setCurrentUser(name);
  };

  const openNewActivity = (dayId?: DayId, timeslot?: Timeslot) => {
    setEditing({
      ...defaultDraft,
      dayId: dayId ?? defaultDraft.dayId,
      timeslot: timeslot ?? defaultDraft.timeslot,
      attendees: participants,
      likedBy: [],
    });
  };

  const saveActivity = (event: FormEvent) => {
    event.preventDefault();
    if (!editing?.title.trim()) return;
    const isEditing = Boolean(editing.id);

    const activity: Activity = {
      ...editing,
      id: editing.id ?? uid(),
      title: editing.title.trim(),
      attendees: participants,
      likedBy: editing.likedBy ?? [],
      booked: editing.booked ?? editing.reservationStatus === 'Gebucht',
      favorite: editing.favorite ?? false,
    };

    setActivities((current) =>
      current.some((item) => item.id === activity.id)
        ? current.map((item) => (item.id === activity.id ? activity : item))
        : [...current, activity],
    );
    recordHistory(isEditing ? 'Planpunkt bearbeitet' : 'Planpunkt hinzugefügt', activity.title);
    setEditing(null);
  };

  const patchActivity = (id: string, patch: Partial<Activity>) => {
    setActivities((current) => current.map((activity) => (activity.id === id ? { ...activity, ...patch } : activity)));
  };

  const deleteActivity = (id: string) => {
    const activity = activities.find((item) => item.id === id);
    setActivities((current) => current.filter((activity) => activity.id !== id));
    recordHistory('Planpunkt gelöscht', activity?.title ?? 'Unbekannter Planpunkt');
  };

  const duplicateActivity = (activity: Activity) => {
    setActivities((current) => [...current, { ...activity, id: uid(), title: `${activity.title} Kopie`, booked: false, likedBy: [] }]);
    recordHistory('Planpunkt dupliziert', activity.title);
  };

  const moveActivity = (id: string, dayId: DayId, timeslot: Timeslot) => {
    const activity = activities.find((item) => item.id === id);
    const day = days.find((item) => item.id === dayId);
    patchActivity(id, { dayId, timeslot });
    setDraggedId(null);
    recordHistory('Planpunkt verschoben', `${activity?.title ?? 'Planpunkt'} nach ${day?.short ?? dayId}, ${timeslot}`);
  };

  if (!currentUser || !participants.includes(currentUser)) {
    return <LoginScreen participants={participants} onSelect={selectUser} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">09.07. - 13.07. 2026</p>
          <h1>Bratislava Reiseboard</h1>
        </div>
        <div className="trip-crew" aria-label="Reisegruppe">
          {participants.map((participant) => (
            <span key={participant} title={participant}>
              {getInitials(participant, participants)}
            </span>
          ))}
        </div>
        <div className="top-actions">
          <div className="user-pill">
            <span>{getInitials(currentUser, participants)}</span>
            <strong>{currentUser}</strong>
            <ChevronDown size={13} />
          </div>
          <button
            className="ghost-button"
            onClick={() => {
              setCurrentUser(null);
            }}
          >
            Wechseln
          </button>
          <button className="primary-action" onClick={() => openNewActivity()}>
            <Plus size={18} /> Planpunkt
          </button>
        </div>
      </header>

      <section className="overview">
        <Metric icon={<CalendarDays />} label="Planpunkte" value={activities.length.toString()} />
        <Metric icon={<Check />} label="Gebucht" value={bookedCount.toString()} />
        <Metric icon={<Heart />} label="Likes" value={likeCount.toString()} />
        <Metric icon={<Euro />} label="Geschätzt p.P." value={`${Math.round(estimatedTotal / Math.max(participants.length, 1))} €`} />
      </section>

      <PlannerBoard
        activities={activities}
        participants={participants}
        currentUser={currentUser}
        draggedId={draggedId}
        setDraggedId={setDraggedId}
        moveActivity={moveActivity}
        openNewActivity={openNewActivity}
        editActivity={(activity) => setEditing(activity)}
        deleteActivity={deleteActivity}
        duplicateActivity={duplicateActivity}
        patchActivity={patchActivity}
        recordHistory={recordHistory}
      />

      <footer className="app-footer">
        <button onClick={() => setShowHistory((current) => !current)}>
          <History size={14} />
          {showHistory ? 'History ausblenden' : 'History anzeigen'}
        </button>
      </footer>

      {showHistory && <HistoryPanel history={history} />}

      {editing && (
        <ActivityModal
          draft={editing}
          setDraft={setEditing}
          participants={participants}
          onSubmit={saveActivity}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

function LoginScreen({ participants, onSelect }: { participants: string[]; onSelect: (name: string) => void }) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Bratislava Reiseboard</p>
        <h1>Wer bin ich?</h1>
        <div className="login-grid">
          {participants.map((participant) => (
            <button key={participant} onClick={() => onSelect(participant)}>
              <span>{getInitials(participant, participants)}</span>
              {participant}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function PlannerBoard({
  activities,
  participants,
  currentUser,
  draggedId,
  setDraggedId,
  moveActivity,
  openNewActivity,
  editActivity,
  deleteActivity,
  duplicateActivity,
  patchActivity,
  recordHistory,
}: {
  activities: Activity[];
  participants: string[];
  currentUser: string;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  moveActivity: (id: string, dayId: DayId, timeslot: Timeslot) => void;
  openNewActivity: (dayId?: DayId, timeslot?: Timeslot) => void;
  editActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  duplicateActivity: (activity: Activity) => void;
  patchActivity: (id: string, patch: Partial<Activity>) => void;
  recordHistory: (action: string, detail: string) => void;
}) {
  return (
    <section className="board-wrap">
      <div className="mobile-day-nav">
        {days.map((day) => (
          <a key={day.id} href={`#day-${day.id}`}>
            {day.short}
          </a>
        ))}
      </div>
      <div className="board">
        {days.map((day) => (
          <article className="day-column" id={`day-${day.id}`} key={day.id} style={{ '--day': day.accent } as CSSProperties}>
            <div className="day-header">
              <div>
                <small>{day.label.split(',')[0]}</small>
                <strong>{day.label.split(' ')[1]}</strong>
              </div>
              <button title="Aktivität hinzufügen" onClick={() => openNewActivity(day.id, 'Vormittag')}>
                <Plus size={16} />
              </button>
            </div>
            {timeslots.map((timeslot) => {
              const slotActivities = activities.filter((activity) => activity.dayId === day.id && activity.timeslot === timeslot);
              return (
                <div
                  className={`slot ${draggedId ? 'drop-ready' : ''}`}
                  key={timeslot}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => draggedId && moveActivity(draggedId, day.id, timeslot)}
                >
                  <div className="slot-title">
                    <span>{timeslot}</span>
                    <button title="Slot befüllen" onClick={() => openNewActivity(day.id, timeslot)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  {slotActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      participants={participants}
                      currentUser={currentUser}
                      onDragStart={() => setDraggedId(activity.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onEdit={() => editActivity(activity)}
                      onDelete={() => deleteActivity(activity.id)}
                      onDuplicate={() => duplicateActivity(activity)}
                      onPatch={(patch) => patchActivity(activity.id, patch)}
                      recordHistory={recordHistory}
                    />
                  ))}
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityCard({
  activity,
  participants,
  currentUser,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onDuplicate,
  onPatch,
  recordHistory,
}: {
  activity: Activity;
  participants: string[];
  currentUser: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPatch: (patch: Partial<Activity>) => void;
  recordHistory: (action: string, detail: string) => void;
}) {
  const meta = categoryMeta[activity.category];
  const likedByCurrentUser = activity.likedBy.includes(currentUser);
  const hasMapsLink = activity.mapsUrl.trim().length > 0;
  const toggleLike = () =>
    {
      onPatch({
        likedBy: likedByCurrentUser
          ? activity.likedBy.filter((participant) => participant !== currentUser)
          : [...activity.likedBy, currentUser],
      });
      recordHistory(likedByCurrentUser ? 'Like entfernt' : 'Planpunkt geliked', activity.title);
    };

  return (
    <div className="activity-card" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="card-top">
        <div className="card-kicker">
          <span className="drag-handle">
            <GripVertical size={16} />
          </span>
          <span className="badge" style={{ '--badge': meta.color } as CSSProperties}>
            {meta.icon} {activity.category}
          </span>
          <span className="inline-time">{activity.timeRange || activity.timeslot}</span>
        </div>
        <button className={`icon-button ${likedByCurrentUser ? 'hot' : ''}`} title={likedByCurrentUser ? 'Like entfernen' : 'Aktivität liken'} onClick={toggleLike}>
          <Heart size={16} fill={likedByCurrentUser ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3>{activity.title}</h3>
      <p>{activity.description}</p>
      {hasMapsLink ? (
        <>
          <a className="location-line" href={activity.mapsUrl} target="_blank" rel="noreferrer" title="In Google Maps öffnen">
            <MapPin size={15} /> {activity.location}
          </a>
          <iframe
            className="map-preview"
            title={`Karte: ${activity.location}`}
            src={getMapPreviewUrl(activity)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </>
      ) : (
        activity.location && (
          <div className="location-line location-line-static">
            <MapPin size={15} /> {activity.location}
          </div>
        )
      )}
      <div className="card-meta">
        <span>{activity.priority}</span>
        <span>{activity.costPerPerson} € p.P.</span>
        <span className={activity.booked ? 'status-booked' : ''}>{activity.reservationStatus}</span>
      </div>
      <div className="likes-row">
        <span>{activity.likedBy.length ? `${activity.likedBy.length} Likes` : 'Noch keine Likes'}</span>
        {activity.likedBy.length > 0 && (
          <div className="attendees">
            {activity.likedBy.map((participant) => (
              <button
                key={participant}
                className={`active ${participant === currentUser ? 'is-me' : ''}`}
                title={`${participant} mag diese Aktivität`}
                onClick={() => participant === currentUser && toggleLike()}
              >
                {getInitials(participant, participants)}
              </button>
            ))}
          </div>
        )}
      </div>
      {activity.notes && <p className="note">{activity.notes}</p>}
      <div className="card-actions">
        <button title="Bearbeiten" onClick={onEdit}>
          <Pencil size={15} />
        </button>
        <button title="Duplizieren" onClick={onDuplicate}>
          <Copy size={15} />
        </button>
        <button
          title="Als gebucht markieren"
          className={activity.booked ? 'is-booked' : ''}
          onClick={() => {
            onPatch({ booked: !activity.booked, reservationStatus: activity.booked ? 'Offen' : 'Gebucht' });
            recordHistory(activity.booked ? 'Buchung zurückgesetzt' : 'Als gebucht markiert', activity.title);
          }}
        >
          <Check size={15} />
        </button>
        {hasMapsLink && (
          <a title="Google Maps öffnen" href={activity.mapsUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
          </a>
        )}
        <button title="Löschen" onClick={onDelete}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ActivityModal({
  draft,
  setDraft,
  participants,
  onSubmit,
  onClose,
}: {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  participants: string[];
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  const patch = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Planpunkt</p>
            <h2>{draft.id ? 'Aktivität bearbeiten' : 'Aktivität hinzufügen'}</h2>
          </div>
          <button type="button" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="form-grid">
          <label>
            Titel
            <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} autoFocus />
          </label>
          <label>
            Zeitraum
            <input value={draft.timeRange} onChange={(event) => patch({ timeRange: event.target.value })} placeholder="z.B. 10:00-12:00" />
          </label>
          <label>
            Tag
            <select value={draft.dayId} onChange={(event) => patch({ dayId: event.target.value as DayId })}>
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Timeslot
            <select value={draft.timeslot} onChange={(event) => patch({ timeslot: event.target.value as Timeslot })}>
              {timeslots.map((timeslot) => (
                <option key={timeslot}>{timeslot}</option>
              ))}
            </select>
          </label>
          <label>
            Kategorie
            <select value={draft.category} onChange={(event) => patch({ category: event.target.value as Category })}>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Priorität
            <select value={draft.priority} onChange={(event) => patch({ priority: event.target.value as Priority })}>
              {['Must-have', 'Optional', 'Backup'].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label>
            Standort
            <input value={draft.location} onChange={(event) => patch({ location: event.target.value })} />
          </label>
          <label>
            Google Maps Link
            <input value={draft.mapsUrl} onChange={(event) => patch({ mapsUrl: event.target.value })} />
          </label>
          <label>
            Kosten pro Person
            <input type="number" value={draft.costPerPerson} onChange={(event) => patch({ costPerPerson: Number(event.target.value) })} />
          </label>
          <label>
            Reservierung
            <select value={draft.reservationStatus} onChange={(event) => patch({ reservationStatus: event.target.value as ReservationStatus })}>
              {['Offen', 'Angefragt', 'Gebucht', 'Bezahlt'].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Beschreibung
            <textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
          </label>
          <label className="wide">
            Notizen
            <textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </label>
        </div>
        <div className="modal-info">
          Aktivitäten gelten automatisch für alle {participants.length} Teilnehmer. Likes werden danach direkt auf der Card vergeben.
        </div>
        <button className="primary-button" type="submit">
          Speichern
        </button>
      </form>
    </div>
  );
}

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  return (
    <section className="panel-grid">
      <PanelHeading icon={<History />} title="History" />
      <div className="history-list">
        {history.length === 0 && <p className="empty-state">Noch keine Aktionen gespeichert.</p>}
        {history.map((entry) => (
          <article className="history-item" key={entry.id}>
            <span>{getInitials(entry.user, [])}</span>
            <div>
              <strong>{entry.action}</strong>
              <p>{entry.detail}</p>
            </div>
            <time>{formatHistoryTime(entry.timestamp)}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: () => void }) {
  return (
    <div className="panel-heading">
      <h2>
        {icon} {title}
      </h2>
      {action && (
        <button className="ghost-button" onClick={action}>
          <Plus size={18} /> Neu
        </button>
      )}
    </div>
  );
}
