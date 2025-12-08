// Custom toggle switch komponent der bruges til at åbne/lukke lokaler.

"use client";

type SmoothSwitchProps = {
  checked: boolean;
  onChange: () => void;
};

export default function SmoothSwitch({ checked, onChange }: SmoothSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 
        ${checked ? "bg-red-600" : "bg-[#0052cc]"}`}
      style={{ boxShadow: "inset 0 1px 4px rgba(0,0,0,0.25)" }}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-300 
          ${checked ? "translate-x-6" : "translate-x-0"}`}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
      ></span>
    </button>
  );
}
