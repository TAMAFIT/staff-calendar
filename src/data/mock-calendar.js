import { BOOKING_TYPES, TRAINERS } from "../config.js";
import { addDays, addMinutesToDateTime, combineDateAndTime, toISODate } from "../utils/date.js";

const CUSTOMER_NAMES = [
  "山田 花子", "佐藤 一郎", "鈴木 美香", "高橋 健", "伊藤 和子",
  "中村 直子", "小林 博", "森井 恵", "野口 誠", "西原 由美"
];

const TIMES = ["09:30", "10:00", "11:30", "13:00", "14:30", "16:00", "18:00", "19:30"];

function makeEvent({ id, date, time, duration = 60, customerName, trainerIndex, type = "member", notes = "" }) {
  const startAt = combineDateAndTime(date, time);
  return {
    id,
    customerName,
    trainerId: TRAINERS[trainerIndex % TRAINERS.length].id,
    startAt,
    endAt: addMinutesToDateTime(startAt, duration),
    duration,
    type,
    notes,
    status: "confirmed",
    source: "mock",
    createdAt: `${date}T08:00:00`,
    updatedAt: `${date}T08:00:00`
  };
}

export function createMockEvents(anchorDate = new Date()) {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const events = [];
  const eventDays = [1, 3, 4, 5, 6, 8, 10, 11, 12, 14, 16, 18, 19, 20, 22, 25, 27, 29];
  let sequence = 1;

  eventDays.forEach((dayNumber, dayIndex) => {
    const date = toISODate(addDays(monthStart, dayNumber - 1));
    const count = dayNumber === 11 ? 7 : (dayIndex % 4) + 1;
    for (let index = 0; index < count; index += 1) {
      events.push(makeEvent({
        id: `mock-${sequence}`,
        date,
        time: TIMES[(dayIndex + index) % TIMES.length],
        duration: index % 3 === 0 ? 30 : 60,
        customerName: CUSTOMER_NAMES[(dayIndex * 2 + index) % CUSTOMER_NAMES.length],
        trainerIndex: dayIndex + index,
        type: dayNumber === 11 && index === 1 ? "trial" : "member",
        notes: index === 0 && dayIndex % 3 === 0 ? "姿勢と肩まわりを確認" : ""
      }));
      sequence += 1;
    }
  });

  const blockDate = toISODate(addDays(monthStart, 20));
  events.push(makeEvent({
    id: `mock-${sequence}`,
    date: blockDate,
    time: "12:00",
    duration: 90,
    customerName: "スタッフ予定",
    trainerIndex: 0,
    type: "blocked"
  }));

  return events;
}

export function getBookingType(typeId) {
  return BOOKING_TYPES.find((type) => type.id === typeId) || BOOKING_TYPES[0];
}
