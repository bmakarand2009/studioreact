"use client";

import * as React from "react";
import {
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  endOfWeek,
} from "date-fns";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Event {
  id: number;
  name: string;
  time: string;
  datetime: string;
}

interface CalendarData {
  day: Date;
  events: Event[];
}

interface WeekViewCalendarProps {
  data: CalendarData[];
  weekStart: Date;
  /** Day to highlight as selected (and scroll into view on mobile) */
  selectedDay?: Date;
  /** Called when user taps a day header to change selection */
  onDaySelect?: (day: Date) => void;
}

function parseTimeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let [, h, m, period] = match;
  let hour = parseInt(h!, 10);
  const min = parseInt(m!, 10);
  if (period?.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

const HOURS_START = 6;
const HOURS_END = 23; // 6 AM to 11 PM inclusive
const HOURS = Array.from(
  { length: HOURS_END - HOURS_START },
  (_, i) => HOURS_START + i
);

export function WeekViewCalendar({
  data,
  weekStart,
  selectedDay,
  onDaySelect,
}: WeekViewCalendarProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const dayHeaderRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const weekEnd = endOfWeek(weekStart);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // On mobile, show only the selected day; fallback to today or first day of week
  const displayDay = React.useMemo(() => {
    if (!isMobile) return null;
    const inWeek = selectedDay && days.find((d) => isSameDay(d, selectedDay));
    if (inWeek) return selectedDay!;
    return days.find((d) => isToday(d)) ?? days[0];
  }, [isMobile, selectedDay, days]);

  const getEventsForCell = React.useCallback(
    (day: Date, hour: number) => {
      const minStart = hour * 60;
      const minEnd = (hour + 1) * 60;
      return data
        .filter((item) => isSameDay(item.day, day))
        .flatMap((item) =>
          item.events.filter((event) => {
            const mins = parseTimeToMinutes(event.time);
            return mins >= minStart && mins < minEnd;
          })
        );
    },
    [data]
  );

  const isSelectedOrToday = (day: Date) =>
    selectedDay ? isSameDay(day, selectedDay) : isToday(day);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col lg:flex-none",
        isMobile ? "overflow-x-hidden overflow-y-auto" : "overflow-auto"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-xs leading-6">
        {/* Week days header: on mobile horizontally scrollable strip (scrollbar hidden); on desktop full grid */}
        <div
          className={cn(
            "text-center text-xs font-semibold leading-6",
            !isMobile && "border border-gray-200 dark:border-gray-700",
            isMobile
              ? "sticky top-0 z-10 flex min-w-0 overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "grid w-full grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr]"
          )}
        >
          {!isMobile && (
            <div className="border-r border-gray-200 py-2.5 dark:border-gray-700" />
          )}
          {days.map((day, idx) => {
            const selected = isSelectedOrToday(day);
            const isLastCol = idx === 6;
            return (
              <div
                ref={(el) => {
                  dayHeaderRefs.current[idx] = el;
                }}
                key={day.toISOString()}
                role={onDaySelect ? "button" : undefined}
                tabIndex={onDaySelect ? 0 : undefined}
                onClick={() => onDaySelect?.(day)}
                onKeyDown={(e) => {
                  if (onDaySelect && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onDaySelect(day);
                  }
                }}
                className={cn(
                  "py-2.5",
                  !isMobile && "shrink-0",
                  !isMobile && !isLastCol && "border-r border-gray-200 dark:border-gray-700",
                  isMobile && "min-w-0 flex-1",
                  onDaySelect && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50"
                )}
              >
                <div className="text-gray-500 dark:text-gray-400">
                  {format(day, isMobile ? "EEEEE" : "EEE")}
                </div>
                <div
                  className={cn(
                    "mx-auto flex items-center justify-center font-semibold text-gray-900 dark:text-white",
                    isMobile ? "h-7 w-7 text-sm" : "h-8 w-8",
                    selected && "rounded-full bg-primary-500 text-white"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid: on mobile only selected day column; on desktop all 7 days */}
        <div className="flex flex-1 flex-col border-x border-gray-200 dark:border-gray-700">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className={cn(
                "grid w-full border-b border-gray-200 dark:border-gray-700",
                isMobile && displayDay
                  ? "grid-cols-[4rem_1fr]"
                  : "grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr]"
              )}
            >
              <div className="border-r border-gray-200 bg-gray-50/50 py-1 pl-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400">
                {formatHour(hour)}
              </div>
              {isMobile && displayDay ? (
                <div className="min-h-[3rem] min-w-0 overflow-hidden p-1">
                  {getEventsForCell(displayDay, hour).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "flex min-w-0 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs dark:border-primary-800 dark:bg-primary-900/30"
                      )}
                    >
                      <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                        {event.time}
                      </span>
                      <span className="min-w-0 truncate pl-1 text-gray-700 dark:text-gray-300">
                        {event.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                days.map((day, dayIdx) => {
                  const cellEvents = getEventsForCell(day, hour);
                  const isLastCol = dayIdx === 6;
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        "min-h-[3rem] min-w-0 overflow-hidden border-gray-200 p-1 dark:border-gray-700",
                        !isLastCol && "border-r dark:border-gray-700"
                      )}
                    >
                      {cellEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "flex min-w-0 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs dark:border-primary-800 dark:bg-primary-900/30"
                          )}
                        >
                          <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                            {event.time}
                          </span>
                          <span className="min-w-0 truncate pl-1 text-gray-700 dark:text-gray-300">
                            {event.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
