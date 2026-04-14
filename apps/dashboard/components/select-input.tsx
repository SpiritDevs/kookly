"use client";

import { useGT } from "gt-next";
import {
  Children,
  isValidElement,
  useId,
  type ReactNode,
} from "react";
import Select from "react-select";
import { cn, inputClasses, inputFocusedClasses } from "@/components/ui";

export type SelectInputOption = {
  isDisabled?: boolean;
  label: string;
  value: string;
};

type SelectInputProps = Readonly<{
  children?: ReactNode;
  className?: string;
  inputId?: string;
  isDisabled?: boolean;
  name?: string;
  onValueChange: (value: string) => void;
  options?: SelectInputOption[];
  placeholder?: string;
  searchable?: boolean;
  value: string;
}>;

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replaceAll("/", " ");
}

function stringifyOptionLabel(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return stringifyOptionLabel(child.props.children);
      }

      return "";
    })
    .join("");
}

function optionsFromChildren(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; value?: string }>(child)) {
      return [];
    }

    const childValue = child.props.value;

    if (childValue === undefined || childValue === null) {
      return [];
    }

    return [
      {
        isDisabled: child.props.disabled,
        label: stringifyOptionLabel(child.props.children) || String(childValue),
        value: String(childValue),
      },
    ];
  });
}

export function SelectInput({
  children,
  className,
  inputId,
  isDisabled,
  name,
  onValueChange,
  options,
  placeholder,
  searchable = false,
  value,
}: SelectInputProps) {
  const gt = useGT();
  const instanceId = useId();
  const resolvedOptions = options ?? optionsFromChildren(children);
  const selectedOption =
    resolvedOptions.find((option) => option.value === value) ?? null;

  return (
    <Select<SelectInputOption, false>
      inputId={inputId}
      instanceId={inputId ?? instanceId}
      isDisabled={isDisabled}
      isOptionDisabled={(option) => Boolean(option.isDisabled)}
      isSearchable={searchable}
      menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
      menuPosition="fixed"
      name={name}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? gt("No matching options") : gt("No options available")
      }
      onChange={(option) => {
        if (option) {
          onValueChange(option.value);
        }
      }}
      openMenuOnFocus
      options={resolvedOptions}
      placeholder={placeholder}
      unstyled
      value={selectedOption}
      filterOption={({ label, value: optionValue }, inputValue) =>
        normalizeSearchValue(`${label} ${optionValue}`).includes(
          normalizeSearchValue(inputValue),
        )
      }
      classNames={{
        control: ({ isFocused, isDisabled: controlIsDisabled }) =>
          cn(
            inputClasses,
            "h-12 min-h-12 px-1 py-0 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]",
            searchable ? "cursor-text" : "cursor-pointer",
            isFocused && inputFocusedClasses,
            controlIsDisabled && "cursor-not-allowed opacity-60",
            className,
          ),
        dropdownIndicator: ({ isFocused }) =>
          cn(
            "flex h-full items-center px-3 text-[var(--ink-muted)] transition",
            isFocused && "text-[var(--accent)]",
          ),
        indicatorSeparator: () => "hidden",
        indicatorsContainer: () => "h-full",
        input: () => "m-0 px-0 py-0 text-sm text-[var(--panel-ink)]",
        menu: () =>
          "mt-2 overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[0_24px_64px_-28px_color-mix(in_srgb,var(--accent)_25%,transparent)]",
        menuList: () => "max-h-72 p-2",
        menuPortal: () => "z-[9999]",
        noOptionsMessage: () => "px-3 py-2 text-sm text-[var(--ink-muted)]",
        option: ({ isFocused, isSelected, isDisabled: optionIsDisabled }) =>
          cn(
            "rounded-2xl px-3 py-2 text-sm text-[var(--panel-ink)] transition",
            optionIsDisabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer",
            isFocused && !optionIsDisabled && "bg-[var(--accent-soft)]",
            isSelected &&
              !optionIsDisabled &&
              "bg-[color-mix(in_srgb,var(--accent)_14%,white)] text-[var(--accent-strong)]",
          ),
        placeholder: () =>
          "m-0 text-sm text-[color-mix(in_srgb,var(--ink-muted)_70%,white)]",
        singleValue: () => "m-0 text-sm text-[var(--panel-ink)]",
        valueContainer: () => "h-full gap-1 px-3 py-0",
      }}
    />
  );
}
