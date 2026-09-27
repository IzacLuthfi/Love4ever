// src/utils/date.ts

export const APP_TIME_ZONE =
  "Asia/Jakarta";

/*
 * =========================================================
 * TODAY
 *
 * Output:
 * 2026-09-27
 * =========================================================
 */

export function getTodayInJakarta(
  date:
    Date =
    new Date()
): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        APP_TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * CURRENT TIME WIB
 *
 * Output:
 * 14:35
 * =========================================================
 */

export function getCurrentTimeInJakarta(
  date:
    Date =
    new Date()
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        APP_TIME_ZONE,

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * DATE KEY → UTC DATE
 *
 * Input:
 * 2026-09-27
 *
 * Dibuat sebagai UTC supaya string date
 * dari database tidak bergeser satu hari.
 * =========================================================
 */

export function dateKeyToUTCDate(
  dateKey:
    string
): Date {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}

/*
 * =========================================================
 * UTC DATE → DATE KEY
 *
 * Output:
 * 2026-09-27
 * =========================================================
 */

export function utcDateToDateKey(
  date:
    Date
): string {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getUTCDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/*
 * =========================================================
 * ADD DAYS
 *
 * addDaysToDateKey(
 *   "2026-09-27",
 *   -1
 * )
 *
 * => 2026-09-26
 * =========================================================
 */

export function addDaysToDateKey(
  dateKey:
    string,

  amount:
    number
): string {
  const date =
    dateKeyToUTCDate(
      dateKey
    );

  date.setUTCDate(
    date.getUTCDate() +
      amount
  );

  return utcDateToDateKey(
    date
  );
}

/*
 * =========================================================
 * LAST N DAYS
 * =========================================================
 */

export type DateRangeDay = {
  date: string;

  label: string;

  shortDay: string;

  dayNumber: number;
};

export function getLastNDays(
  count:
    number,

  today:
    string =
    getTodayInJakarta()
): DateRangeDay[] {
  if (
    count <=
    0
  ) {
    return [];
  }

  const baseDate =
    dateKeyToUTCDate(
      today
    );

  return Array.from(
    {
      length:
        count,
    },

    (
      _,
      index
    ) => {
      const date =
        new Date(
          baseDate
        );

      const difference =
        count -
        1 -
        index;

      date.setUTCDate(
        date.getUTCDate() -
          difference
      );

      const dateKey =
        utcDateToDateKey(
          date
        );

      const shortDay =
        new Intl.DateTimeFormat(
          "id-ID",
          {
            weekday:
              "short",

            timeZone:
              "UTC",
          }
        ).format(
          date
        );

      const dayNumber =
        date.getUTCDate();

      return {
        date:
          dateKey,

        shortDay,

        dayNumber,

        label:
          `${shortDay} ${dayNumber}`,
      };
    }
  );
}

/*
 * =========================================================
 * LAST 7 DAYS
 * =========================================================
 */

export function getLastSevenDays(
  today:
    string =
    getTodayInJakarta()
): DateRangeDay[] {
  return getLastNDays(
    7,
    today
  );
}

/*
 * =========================================================
 * FORMAT DATE
 *
 * Input:
 * 2026-09-27
 *
 * Output:
 * 27 September 2026
 * =========================================================
 */

export function formatDateID(
  dateKey:
    string
): string {
  if (!dateKey) {
    return "";
  }

  const date =
    dateKeyToUTCDate(
      dateKey
    );

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * FORMAT SHORT DATE
 *
 * Output:
 * 27 Sep 2026
 * =========================================================
 */

export function formatShortDateID(
  dateKey:
    string
): string {
  if (!dateKey) {
    return "";
  }

  const date =
    dateKeyToUTCDate(
      dateKey
    );

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * FORMAT DAY + DATE
 *
 * Output:
 * Minggu, 27 September 2026
 * =========================================================
 */

export function formatFullDateID(
  dateKey:
    string
): string {
  if (!dateKey) {
    return "";
  }

  const date =
    dateKeyToUTCDate(
      dateKey
    );

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * FORMAT TIME
 *
 * Input:
 * 19:30:00
 *
 * Output:
 * 19:30
 * =========================================================
 */

export function formatTime(
  value:
    string | null | undefined
): string {
  if (!value) {
    return "";
  }

  const [
    hour,
    minute,
  ] =
    value.split(":");

  if (
    !hour ||
    !minute
  ) {
    return value;
  }

  return `${hour}:${minute}`;
}

/*
 * =========================================================
 * DATE + TIME
 *
 * Output:
 * 27 September 2026 • 19:30
 * =========================================================
 */

export function formatDateTimeID(
  date:
    string,

  time?:
    | string
    | null
): string {
  const formattedDate =
    formatDateID(
      date
    );

  const formattedTime =
    formatTime(
      time
    );

  if (
    !formattedTime
  ) {
    return formattedDate;
  }

  return `${formattedDate} • ${formattedTime}`;
}

/*
 * =========================================================
 * DIFFERENCE IN DAYS
 *
 * Cocok untuk anniversary/day counter.
 * =========================================================
 */

export function differenceInDays(
  from:
    string,

  to:
    string =
    getTodayInJakarta()
): number {
  const start =
    dateKeyToUTCDate(
      from
    );

  const end =
    dateKeyToUTCDate(
      to
    );

  const milliseconds =
    end.getTime() -
    start.getTime();

  return Math.floor(
    milliseconds /
      86_400_000
  );
}