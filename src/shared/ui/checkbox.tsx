import React, { useState, ChangeEvent, FC } from 'react';

// --- Типы для CustomCheckbox ---
// Определяем интерфейс для пропсов (props) компонента CustomCheckbox
interface CustomCheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; // Необязательный пропс
}


export const CustomCheckbox: FC<CustomCheckboxProps> = ({ id, name, label, checked, onChange, disabled = false }) => {
  return (
    // The label acts as a container, making the entire area clickable.
    <label
      htmlFor={id}
      className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-200 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-gray-700'
      }`}
    >
      {/* The actual checkbox input is visually hidden but remains accessible to screen readers 
        and keyboard navigation. The `peer` class is a Tailwind CSS feature that lets us 
        style sibling elements based on the state of this input.
      */}
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />

      {/* This is the visual representation of the checkbox.
        Its appearance changes when the hidden `peer` input is checked, focused, or disabled.
      */}
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
          ${
            checked
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-gray-600 border-gray-500'
          }
          peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-800 peer-focus:ring-indigo-500`}
      >
        {/* The checkmark icon (SVG), which is only visible when the checkbox is checked */}
        <svg
          className={`w-4 h-4 text-white transition-opacity duration-200 ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      {/* The label text */}
      <span className="text-lg font-medium text-gray-200 select-none">
        {label}
      </span>
    </label>
  );
};