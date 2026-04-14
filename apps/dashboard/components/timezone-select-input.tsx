"use client";

import { useGT } from "gt-next";
import { SelectInput, type SelectInputOption } from "@/components/select-input";
import { allTimezones } from "@/lib/timezones";

type TimezoneSelectInputProps = Readonly<{
  className?: string;
  inputId?: string;
  isDisabled?: boolean;
  name?: string;
  onChange: (timezone: string) => void;
  placeholder?: string;
  value: string;
}>;

const timezoneOptions: SelectInputOption[] = allTimezones.map((timezone) => ({
  label: timezone,
  value: timezone,
}));

export function TimezoneSelectInput({
  className,
  inputId,
  isDisabled,
  name,
  onChange,
  placeholder,
  value,
}: TimezoneSelectInputProps) {
  const gt = useGT();
  const resolvedPlaceholder = placeholder ?? gt("Search all time zones");

  return (
    <SelectInput
      className={className}
      inputId={inputId}
      isDisabled={isDisabled}
      name={name}
      options={timezoneOptions}
      onValueChange={onChange}
      placeholder={resolvedPlaceholder}
      searchable
      value={value}
    />
  );
}
