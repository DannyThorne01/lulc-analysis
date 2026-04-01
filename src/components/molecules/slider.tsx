import React, { useState, useEffect } from "react";
import { SliderProps } from "../../module/global";

const Slider: React.FC<SliderProps> = ({ id, type, min, max, step, value, onChange, style }) => {
  const [sliderVal, setSliderVal] = useState<number>(value);
  const [mouseState, setMouseState] = useState<"down" | "up" | null>(null);

  useEffect(() => {
    setSliderVal(value);
  }, [value]);

  const changeCallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(Number(e.target.value));
  };

  useEffect(() => {
    if (mouseState === "up") {
      onChange(sliderVal);
    }
  }, [mouseState, sliderVal, onChange]);

  return (
    <div className="flex flex-col items-center gap-2 w-full px-1">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Year
        </span>
        <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md tabular-nums">
          {sliderVal}
        </span>
      </div>

      <div className="relative w-full flex items-center">
        <input
          id={id}
          type={type}
          min={min}
          max={max}
          step={step}
          value={sliderVal}
          onChange={changeCallback}
          onMouseDown={() => setMouseState("down")}
          onMouseUp={() => setMouseState("up")}
          style={style}
          className="
            w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-125
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-blue-600
            [&::-moz-range-thumb]:shadow-md
          "
        />
      </div>

      <div className="flex justify-between w-full text-xs text-gray-400 font-medium">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default Slider;
