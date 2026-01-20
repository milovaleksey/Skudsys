"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { buttonVariants } from "./button";

// Простая реализация календаря без react-day-picker
// Используется react-datepicker в отчетах

interface CalendarProps {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single" | "range";
}

function Calendar({
  className,
  selected,
  onSelect,
  mode = "single",
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Добавляем пустые дни в начале
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Добавляем дни месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDayClick = (day: Date) => {
    if (onSelect) {
      onSelect(day);
    }
  };

  const isSelected = (day: Date) => {
    if (!selected) return false;
    return (
      day.getDate() === selected.getDate() &&
      day.getMonth() === selected.getMonth() &&
      day.getFullYear() === selected.getFullYear()
    );
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-center pt-1 relative items-center w-full">
          <button
            onClick={prevMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button
            onClick={nextMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Week days */}
        <div className="flex">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={index} className="relative p-0 text-center text-sm">
              {day ? (
                <button
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-8 p-0 font-normal",
                    isSelected(day) &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground"
                  )}
                >
                  {day.getDate()}
                </button>
              ) : (
                <div className="size-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Calendar };