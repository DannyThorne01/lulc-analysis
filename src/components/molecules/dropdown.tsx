import React, { useState, useEffect, useRef } from "react";

interface DropdownProps {
  options: string[];
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  isEditable?: boolean;
  style?: React.CSSProperties; // External styling for wrapper div
}

const Dropdown: React.FC<DropdownProps> = ({ options, value ="", onChange, label="", isEditable = true, style }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if(isEditable){
        setFilteredOptions(
            options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
          );
    }
  
  }, [inputValue, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditable) {
      setInputValue(e.target.value);
      setIsDropdownOpen(true);
    }
  };

  const handleSelect = (selectedOption: string) => {
    setInputValue(selectedOption);
    onChange(selectedOption);
    setIsDropdownOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div style={style}>
      <input
        ref={inputRef}
        type="text"
        value={isEditable ? inputValue: ""}
        onChange={handleInputChange}
        onClick={() => setIsDropdownOpen(true)} 
        onBlur={handleBlur}
        placeholder="Select or type..."
        readOnly={!isEditable}
        style={{
          width: '100%',
          padding: '5px',
          fontSize: '15px',
          border: '2px solid #f9f9f9',
          borderRadius: '50px',
          color: '#333',
          cursor: isEditable ? 'text' : 'pointer',
          outline: 'none',
          display: 'block', // Ensures proper alignment
          boxSizing: 'border-box', // Prevents width issues
        }}
      />

{isDropdownOpen && filteredOptions.length > 0 && (
        <ul
        style={{
          marginTop: "8px",
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "8px 0",
          maxHeight: "200px",
          overflowY: "auto",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontSize: "14px"
        }}
      >
          {filteredOptions.map((option) => (
            <li
              key={option}
              onMouseDown={() => handleSelect(option)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'left', 
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
