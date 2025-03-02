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
        <div className="range-slider">
            <p>{id}</p>
            <h3>Value: {sliderVal}</h3>
            <input
                value={sliderVal}
                id={id}
                type={type}
                min={min}
                max={max}
                step={step}
                onChange={changeCallback}
                onMouseDown={() => setMouseState("down")}
                onMouseUp={() => setMouseState("up")}
                style={{ width: "100%", cursor: "pointer", accentColor: "#007bff", ...style }}
            />
        </div>
    );
};

export default Slider;
