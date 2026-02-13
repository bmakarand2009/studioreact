"use client";

import * as React from "react";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
  X,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { WeekViewCalendar } from "@/components/ui/week-view-calendar";

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

interface FullScreenCalendarProps {
  data: CalendarData[];
  /** When true, shows New Event button (admin-only). Search is shown on both admin and public. Default false for public view. */
  showAdminActions?: boolean;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

/** Parse "10:00 AM" / "2:30 PM" to minutes since midnight for ordering */
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

export type CalendarViewMode = "month" | "week";

export function FullScreenCalendar({ data, showAdminActions = false }: FullScreenCalendarProps) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const searchParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const viewMode: CalendarViewMode =
    searchParams.get("view") === "week" ? "week" : "month";

  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy")
  );
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(today));
  const [dayEventsPopup, setDayEventsPopup] = React.useState<{
    day: Date;
    events: Event[];
    anchorRect: { left: number; top: number; bottom: number; right: number };
  } | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!dayEventsPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setDayEventsPopup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dayEventsPopup]);

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });
  const weekRows = Math.ceil(days.length / 7);
  /** Min height per row so day cells stay tall enough for 4+ events (avoid ~178px shrink) */
  const rowMinHeight = "12rem";

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"));
    setSelectedDay(today);
    setWeekStart(startOfWeek(today));
  }

  function previousWeek() {
    setWeekStart((prev) => add(prev, { weeks: -1 }));
  }

  function nextWeek() {
    setWeekStart((prev) => add(prev, { weeks: 1 }));
  }

  function handleViewModeChange(mode: CalendarViewMode) {
    const params = new URLSearchParams(search);
    params.set("view", mode);
    const query = params.toString();
    navigate({ pathname, search: query ? `?${query}` : "" }, { replace: true });
    if (mode === "week") setWeekStart(startOfWeek(selectedDay));
  }

  const sortedPopupEvents = dayEventsPopup
    ? [...dayEventsPopup.events].sort(
        (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
      )
    : [];

  return (
    <>
    <div className="flex min-w-0 flex-col overflow-x-hidden">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:flex-auto md:justify-start">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800 md:flex">
              <h1 className="p-1 text-xs uppercase text-gray-500 dark:text-gray-400">
                {format(selectedDay, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-0.5 text-lg font-bold dark:border-gray-700 dark:bg-gray-900">
                <span>{format(selectedDay, "d")}</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {viewMode === "month"
                  ? format(firstDayCurrentMonth, "MMMM, yyyy")
                  : `${format(weekStart, "MMM d")} – ${format(endOfWeek(weekStart), "MMM d, yyyy")}`}
              </h2>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                {viewMode === "month"
                  ? `${format(firstDayCurrentMonth, "MMM d, yyyy")} - ${format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}`
                  : `Week of ${format(weekStart, "MMM d, yyyy")}`}
              </p>
            </div>
          </div>
          {/* Search + view toggle: on phone same row as date; on desktop in the right group below */}
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" className="!outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0" aria-label="Search">
              <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange(viewMode === "month" ? "week" : "month")}
              className="!outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0"
              aria-label={viewMode === "month" ? "Switch to week view" : "Switch to month view"}
            >
              {viewMode === "month" ? (
                <CalendarRange size={16} strokeWidth={2} aria-hidden="true" />
              ) : (
                <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="icon" className="!outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0" aria-label="Search">
              <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange(viewMode === "month" ? "week" : "month")}
              className="!outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0"
              aria-label={viewMode === "month" ? "Switch to week view" : "Switch to month view"}
            >
              {viewMode === "month" ? (
                <CalendarRange size={16} strokeWidth={2} aria-hidden="true" />
              ) : (
                <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </Button>
          </div>
          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg md:w-auto rtl:space-x-reverse">
            <Button
              onClick={viewMode === "month" ? previousMonth : previousWeek}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 !outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0"
              variant="ghost"
              size="icon"
              aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto !outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0"
              variant="ghost"
            >
              Today
            </Button>
            <Button
              onClick={viewMode === "month" ? nextMonth : nextWeek}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 !outline-none focus:!outline-none focus-visible:!outline-none active:!outline-none !ring-0 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 active:!ring-0 active:!ring-offset-0"
              variant="ghost"
              size="icon"
              aria-label={viewMode === "month" ? "Next month" : "Next week"}
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          {showAdminActions && (
            <>
              <Separator orientation="vertical" className="hidden h-6 md:block" />
              <Separator
                orientation="horizontal"
                className="block w-full md:hidden"
              />
              <Button className="w-full gap-2 md:w-auto" variant="primary">
                <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
                <span>New Event</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Calendar content: Week view or Month view */}
      {viewMode === "week" ? (
        <div className="min-w-0 overflow-x-hidden">
          <WeekViewCalendar
            data={data}
            weekStart={weekStart}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
        </div>
      ) : (
      <div className="lg:flex lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border border-gray-200 text-center text-xs font-semibold leading-6 dark:border-gray-700 lg:flex-none">
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Sun</div>
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Mon</div>
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Tue</div>
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Wed</div>
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Thu</div>
          <div className="border-r border-gray-200 py-2.5 dark:border-gray-700">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6">
          <div
            className="hidden w-full border-x border-gray-200 lg:grid lg:grid-cols-7 dark:border-gray-700"
            style={{
              gridTemplateRows: `repeat(${weekRows}, minmax(${rowMinHeight}, 1fr))`,
            }}
          >
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => setSelectedDay(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && "text-white",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-gray-900 dark:text-white",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "text-gray-500 dark:text-gray-400",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                      "font-semibold",
                    "flex h-14 flex-col border-b border-gray-200 px-3 py-2 hover:bg-gray-100 focus:z-10 dark:border-gray-700 dark:hover:bg-gray-800",
                    dayIdx % 7 !== 6 && "border-r border-gray-200 dark:border-gray-700"
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-primary-500 text-white",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-primary-500 text-white"
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  {data.filter((date) => isSameDay(date.day, day)).length >
                    0 && (
                    <div>
                      {data
                        .filter((date) => isSameDay(date.day, day))
                        .map((date) => (
                          <div
                            key={date.day.toString()}
                            className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                          >
                            {date.events.map((event) => (
                              <span
                                key={event.id}
                                className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 dark:bg-gray-400"
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400",
                    "relative flex flex-col border-b border-gray-200 hover:bg-gray-100 focus:z-10 dark:border-gray-700 dark:hover:bg-gray-800",
                    dayIdx % 7 !== 6 && "border-r border-gray-200 dark:border-gray-700",
                    !isEqual(day, selectedDay) && "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <header className="flex items-center justify-between px-2.5 pt-1.5 pb-1">
                    <button
                      type="button"
                      className={cn(
                        isEqual(day, selectedDay) && "text-white",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          "text-gray-900 dark:text-white",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-gray-500 dark:text-gray-400",
                        isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "border-none bg-primary-500",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "bg-gray-900 dark:bg-white dark:text-gray-900",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                          "font-semibold",
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border border-gray-200 dark:border-gray-600"
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 overflow-hidden px-2.5 pt-2.5 pb-2">
                    {data
                      .filter((event) => isSameDay(event.day, day))
                      .map((dayData) => (
                        <div key={dayData.day.toString()} className="space-y-1">
                          {dayData.events.slice(0, 4).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-[10px] leading-tight dark:border-primary-800 dark:bg-primary-900/30"
                              title={event.name}
                            >
                              <span className="shrink-0 text-gray-500 dark:text-gray-400">
                                {event.time}
                              </span>
                              <span className="min-w-0 truncate font-medium">
                                {event.name}
                              </span>
                            </div>
                          ))}
                          {dayData.events.length > 4 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setDayEventsPopup({
                                  day,
                                  events: dayData.events,
                                  anchorRect: {
                                    left: rect.left,
                                    top: rect.top,
                                    bottom: rect.bottom,
                                    right: rect.right,
                                  },
                                });
                              }}
                              className="text-[10px] font-medium text-primary-500 hover:text-primary-500 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              + {dayData.events.length - 4} more
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            className="isolate grid w-full grid-cols-7 border-x border-gray-200 lg:hidden dark:border-gray-700"
            style={{
              gridTemplateRows: `repeat(${weekRows}, minmax(min-content, 1fr))`,
            }}
          >
            {days.map((day, dayIdx) => (
              <button
                onClick={() => {
                  setSelectedDay(day);
                  const dayData = data.find((d) => isSameDay(d.day, day));
                  setDayEventsPopup({
                    day,
                    events: dayData?.events ?? [],
                    anchorRect: { left: 0, top: 0, bottom: 0, right: 0 },
                  });
                }}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "text-white",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-gray-900 dark:text-white",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-gray-500 dark:text-gray-400",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex min-h-14 flex-col border-b border-gray-200 px-3 py-2 hover:bg-gray-100 focus:z-10 dark:border-gray-700 dark:hover:bg-gray-800",
                  dayIdx % 7 !== 6 && "border-r border-gray-200 dark:border-gray-700"
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      isToday(day) &&
                      "bg-primary-500 text-white",
                    isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      "bg-primary-500 text-white"
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-gray-500 dark:bg-gray-400"
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>

    {dayEventsPopup && (() => {
      const isMobileSheet = !isDesktop;
      const eventsContent = (
        <>
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {format(dayEventsPopup.day, "EEEE, MMM d, yyyy")}
            </h3>
            <button
              type="button"
              onClick={() => setDayEventsPopup(null)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
            <ul className="space-y-1.5">
              {sortedPopupEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded border border-primary-200 bg-primary-50 py-2 px-3 text-sm dark:border-primary-800 dark:bg-primary-900/30"
                >
                  <span className="shrink-0 text-gray-500 dark:text-gray-400">
                    {event.time}
                  </span>
                  <span className="min-w-0 font-medium text-gray-900 dark:text-white">
                    {event.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      );

      if (isMobileSheet) {
        return (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setDayEventsPopup(null)}
              aria-hidden
            />
            <div
              ref={popupRef}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl bg-white px-5 pb-8 pt-2 shadow-xl dark:bg-gray-900"
            >
              <div className="flex justify-center pb-3">
                <div className="h-1 w-12 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
              </div>
              {eventsContent}
            </div>
          </>
        );
      }

      const { anchorRect } = dayEventsPopup;
      const pad = 8;
      const popupWidth = 384;
      const estimatedHeight = 320;
      const spaceBelow = typeof window !== "undefined" ? window.innerHeight - anchorRect.bottom - pad : 400;
      const openAbove = spaceBelow < estimatedHeight;
      const top = openAbove ? anchorRect.top - estimatedHeight - pad : anchorRect.bottom + pad;
      const left = typeof window !== "undefined"
        ? Math.max(pad, Math.min(anchorRect.left, window.innerWidth - popupWidth - pad))
        : anchorRect.left;
      return (
        <div
          ref={popupRef}
          className="fixed z-50 w-full max-w-sm rounded-lg bg-white shadow-lg dark:bg-gray-900"
          style={{ top, left }}
        >
          {eventsContent}
        </div>
      );
    })()}

    </>
  );
}
