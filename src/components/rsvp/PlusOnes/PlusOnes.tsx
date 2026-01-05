import React, { useState } from 'react';
import './PlusOnes.css';

interface PlusOne {
  name: string;
  mealChoiceId?: string;
}

interface PlusOnesProps {
  maxCount: number;
  value: PlusOne[];
  onChange: (plusOnes: PlusOne[]) => void;
  menuItems?: Array<{ id: string; name: string; category: string }>;
}

export const PlusOnes: React.FC<PlusOnesProps> = ({
  maxCount,
  value,
  onChange,
  menuItems = [],
}) => {
  const [count, setCount] = useState(value.length);

  const handleCountChange = (newCount: number) => {
    if (newCount < 0 || newCount > maxCount) return;
    
    setCount(newCount);
    const newPlusOnes: PlusOne[] = Array(newCount)
      .fill(null)
      .map((_, i) => value[i] || { name: '' });
    onChange(newPlusOnes);
  };

  const handleNameChange = (index: number, name: string) => {
    const newPlusOnes = [...value];
    newPlusOnes[index] = { ...newPlusOnes[index], name };
    onChange(newPlusOnes);
  };

  const handleMealChange = (index: number, mealChoiceId: string) => {
    const newPlusOnes = [...value];
    newPlusOnes[index] = { ...newPlusOnes[index], mealChoiceId };
    onChange(newPlusOnes);
  };

  if (maxCount === 0) {
    return null;
  }

  return (
    <div className="plus-ones">
      <div className="plus-ones-header">
        <label>Plus Ones</label>
        <div className="count-controls">
          <button
            type="button"
            onClick={() => handleCountChange(count - 1)}
            disabled={count === 0}
          >
            −
          </button>
          <span>{count} / {maxCount}</span>
          <button
            type="button"
            onClick={() => handleCountChange(count + 1)}
            disabled={count >= maxCount}
          >
            +
          </button>
        </div>
      </div>

      {Array(count)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="plus-one-item">
            <div className="form-group">
              <label>Name {index + 1}</label>
              <input
                type="text"
                value={value[index]?.name || ''}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder="Enter name"
              />
            </div>
            {menuItems.length > 0 && (
              <div className="form-group">
                <label>Meal Choice</label>
                <select
                  value={value[index]?.mealChoiceId || ''}
                  onChange={(e) => handleMealChange(index, e.target.value)}
                >
                  <option value="">Select meal</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

