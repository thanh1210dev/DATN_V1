import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Space, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import moment from 'moment-timezone';

const { RangePicker } = DatePicker;

export const DATE_PRESETS = [
  { key: 'TODAY', label: 'Hôm nay', range: () => [moment().startOf('day'), moment().endOf('day')] },
  { key: 'YESTERDAY', label: 'Hôm qua', range: () => [moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day')] },
  { key: 'LAST_7_DAYS', label: '7 ngày qua', range: () => [moment().subtract(6, 'day').startOf('day'), moment().endOf('day')] },
  { key: 'LAST_30_DAYS', label: '30 ngày qua', range: () => [moment().subtract(29, 'day').startOf('day'), moment().endOf('day')] },
  { key: 'THIS_MONTH', label: 'Tháng này', range: () => [moment().startOf('month'), moment().endOf('month')] },
  { key: 'LAST_MONTH', label: 'Tháng trước', range: () => [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] },
  { key: 'THIS_QUARTER', label: 'Quý này', range: () => [moment().startOf('quarter'), moment().endOf('quarter')] },
  { key: 'YTD', label: 'Từ đầu năm', range: () => [moment().startOf('year'), moment().endOf('day')] },
];

const DateRangeFilter = ({
  value,
  onChange,
  presets = DATE_PRESETS,
  format = 'DD/MM/YYYY',
  allowClear = true,
  size = 'middle',
  style = {},
  debounceMs = 350,
  maxRangeDays = null, // optional limit of selectable span
}) => {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [internalValue, setInternalValue] = useState(value);
  const debounceRef = useRef(null);

  // Sync external value -> internal
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (!value || !value[0] || !value[1]) {
      setSelectedPreset(null);
      return;
    }
    const matched = presets.find(p => {
      const [ps, pe] = p.range();
      return ps.isSame(value[0], 'day') && pe.isSame(value[1], 'day');
    });
    if (!matched && selectedPreset) setSelectedPreset(null);
    if (matched && matched.key !== selectedPreset) setSelectedPreset(matched.key);
  }, [value, presets, selectedPreset]);

  const applyChange = (dates) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(dates || [null, null]);
    }, debounceMs);
  };

  const handlePresetClick = (presetKey) => {
    if (!presetKey) {
      setSelectedPreset(null);
      applyChange([null, null]);
      return;
    }
    const preset = presets.find(p => p.key === presetKey);
    if (preset) {
      const range = preset.range();
      setSelectedPreset(presetKey);
      setInternalValue(range);
      applyChange(range);
    }
  };

  const handleRangeChange = (dates) => {
    // Enforce max range if provided
    if (dates && dates[0] && dates[1] && maxRangeDays) {
      const diff = dates[1].endOf('day').diff(dates[0].startOf('day'), 'days');
      if (diff > maxRangeDays) {
        // Trim end date
        dates[1] = dates[0].clone().add(maxRangeDays, 'days');
      }
    }
    setInternalValue(dates);
    setSelectedPreset(null);
    // Only apply when both dates selected or cleared
    if (!dates || (dates[0] && dates[1])) {
      applyChange(dates);
    }
  };

  const disabledDate = (current) => {
    // Disable future dates
    if (current && current > moment().endOf('day')) return true;
    return false;
  };

  return (
    <Space direction="vertical" className="w-full" size={4} style={style}>
      <div className="flex flex-wrap gap-2">
        {presets.map(p => {
          const active = p.key === selectedPreset;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetClick(p.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'}`}
            >
              {p.label}
            </button>
          );
        })}
        {allowClear && (
          <button
            type="button"
            onClick={() => handlePresetClick(null)}
            className="px-3 py-1 rounded-full text-sm font-medium border bg-white text-gray-500 hover:text-red-500 hover:border-red-400"
          >
            Reset
          </button>
        )}
      </div>
      <Tooltip title="Chọn khoảng ngày tùy ý">
        <RangePicker
          value={internalValue}
          onChange={handleRangeChange}
          format={format}
          allowClear={allowClear}
          size={size}
          className="w-full"
          suffixIcon={<CalendarOutlined />}
          disabledDate={disabledDate}
          inputReadOnly
        />
      </Tooltip>
    </Space>
  );
};

export default DateRangeFilter;
