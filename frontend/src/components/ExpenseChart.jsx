import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../context/FinanceContext';

export default function ExpenseChart({ currencySymbol = '$' }) {
  const { expenses, totalBudget, theme } = useFinance();

  const data = useMemo(() => {
    // Generate an array for days 1 to 31
    const days = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      spent: 0,
      expected: (totalBudget / 31) * (i + 1)
    }));

    // Calculate cumulative sum
    let cumulative = 0;
    
    // Sort expenses by date ascending
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentDayIdx = 0;
    // Remove the restriction of currentDay so future logged expenses show up!
    const maxDay = sorted.length > 0 ? Math.max(new Date().getDate(), new Date(sorted[sorted.length - 1].date).getDate()) : new Date().getDate();

    sorted.forEach(exp => {
      const expDate = new Date(exp.date);
      const expDay = expDate.getDate();
      
      // Add previous cumulative values up to this day
      while (currentDayIdx < expDay - 1 && currentDayIdx < 31) {
        days[currentDayIdx].spent = cumulative;
        currentDayIdx++;
      }
      
      cumulative += parseFloat(exp.amount);
      if (currentDayIdx < 31) {
        days[currentDayIdx].spent = cumulative;
      }
    });

    // Fill remaining days up to the max calculated day
    while (currentDayIdx < maxDay && currentDayIdx < 31) {
      days[currentDayIdx].spent = cumulative;
      currentDayIdx++;
    }
    
    // Set future days to null so the line ends gracefully instead of dropping to 0
    while (currentDayIdx < 31) {
      days[currentDayIdx].spent = null;
      currentDayIdx++;
    }

    return days;
  }, [expenses, totalBudget]);

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const expected = payload.find(p => p.dataKey === 'expected')?.value || 0;
      const spent = payload.find(p => p.dataKey === 'spent')?.value;
      
      if (spent === undefined || spent === null) return null;
      
      const isOverspent = spent > expected;
      const overage = spent - expected;
      
      return (
        <div style={{
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: '12px',
          color: theme === 'dark' ? '#fff' : '#0f172a',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '10px 14px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{`Day ${label}`}</p>
          <p style={{ margin: '4px 0', color: textColor }}>
            Expected : {currencySymbol}{expected.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', color: '#818cf8' }}>
            Actual Spent : {currencySymbol}{spent.toFixed(2)}
          </p>
          {isOverspent && (
            <p style={{ margin: '4px 0', color: '#ef4444', fontWeight: 'bold', fontSize: '0.9em' }}>
              {currencySymbol}{overage.toFixed(2)} spent extra
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderDot = (props) => {
    const { cx, cy, payload, value } = props;
    if (value === null || value === undefined) return null;
    
    const isOverspent = payload.spent > payload.expected;
    
    return (
      <circle 
        key={`dot-${payload.day}`} 
        cx={cx} 
        cy={cy} 
        r={isOverspent ? 4 : 3} 
        stroke={isOverspent ? '#ef4444' : '#818cf8'} 
        strokeWidth={isOverspent ? 2 : 1.5} 
        fill={theme === 'dark' ? '#1e293b' : '#ffffff'} 
      />
    );
  };

  const renderActiveDot = (props) => {
    const { cx, cy, payload, value } = props;
    if (value === null || value === undefined) return null;
    
    const isOverspent = payload.spent > payload.expected;
    
    return (
      <circle 
        key={`active-dot-${payload.day}`} 
        cx={cx} 
        cy={cy} 
        r={6} 
        stroke={isOverspent ? '#ef4444' : '#818cf8'} 
        strokeWidth={3} 
        fill="#ffffff" 
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="day" 
          stroke={textColor} 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke={textColor} 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${currencySymbol}${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="expected" 
          stroke={textColor} 
          strokeDasharray="5 5" 
          fill="none" 
          name="Expected" 
        />
        <Area 
          type="stepAfter" 
          dataKey="spent" 
          stroke="#818cf8" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorSpent)" 
          name="Actual Spent" 
          dot={renderDot}
          activeDot={renderActiveDot}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
