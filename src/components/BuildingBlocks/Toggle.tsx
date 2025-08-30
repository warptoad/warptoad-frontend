import { useState } from "react";

type ToggleProps = {
  defaultOn?: boolean;
  onToggle?: (value: boolean) => void;
};

function Toggle({ defaultOn = false, onToggle }: ToggleProps) {
  const [isOn, setIsOn] = useState(defaultOn);

  const handleClick = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onToggle?.(newValue);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
        isOn ? "bg-secondary" : "bg-gray-400"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
          isOn ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default Toggle;
