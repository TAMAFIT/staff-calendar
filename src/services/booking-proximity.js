export const BOOKING_BUFFER_MINUTES = 30;

export function findBufferWarnings(events, candidate, excludeId = null, bufferMinutes = BOOKING_BUFFER_MINUTES) {
  if (!candidate.trainerId) return [];
  const candidateStart = Date.parse(candidate.startAt);
  const candidateEnd = Date.parse(candidate.endAt);
  const bufferMs = bufferMinutes * 60 * 1000;

  if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd)) return [];

  return events.filter((event) => {
    if (event.id === excludeId || event.trainerId !== candidate.trainerId) return false;

    const eventStart = Date.parse(event.startAt);
    const eventEnd = Date.parse(event.endAt);
    if (!Number.isFinite(eventStart) || !Number.isFinite(eventEnd)) return false;

    const gapAfterExisting = candidateStart - eventEnd;
    const gapBeforeExisting = eventStart - candidateEnd;
    return (gapAfterExisting >= 0 && gapAfterExisting < bufferMs)
      || (gapBeforeExisting >= 0 && gapBeforeExisting < bufferMs);
  });
}
