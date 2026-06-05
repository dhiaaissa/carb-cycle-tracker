import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useAppData() {
  const [config, setConfig]     = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [days, setDays]         = useState({});
  const [stats, setStats]       = useState(null);
  const [foods, setFoods]       = useState({ foods: {}, categories: [] });
  const [presets, setPresets]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      // Fetch independently so one failure doesn't block the rest
      const results = await Promise.allSettled([
        api.getConfig(),
        api.getSchedule(),
        api.getDays(),
        api.getStats(),
        api.getFoods(),
        api.getPresets(),
      ]);

      const [cfgR, schedR, daysR, stR, foodR, preR] = results;

      if (cfgR.status === 'fulfilled') setConfig(cfgR.value);
      if (schedR.status === 'fulfilled') setSchedule(schedR.value);
      if (daysR.status === 'fulfilled') {
        const dayMap = {};
        daysR.value.forEach(d => { dayMap[d.day_index] = d; });
        setDays(dayMap);
      }
      if (stR.status === 'fulfilled') setStats(stR.value);
      if (foodR.status === 'fulfilled') setFoods(foodR.value);
      if (preR.status === 'fulfilled') setPresets(preR.value);

      // Log any failures
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const names = ['config', 'schedule', 'days', 'stats', 'foods', 'presets'];
          console.warn(`Failed to fetch ${names[i]}:`, r.reason);
        }
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateDay = useCallback(async (dayIndex, data) => {
    const updated = await api.updateDay(dayIndex, data);
    setDays(prev => ({ ...prev, [dayIndex]: updated }));
    const st = await api.getStats();
    setStats(st);
    return updated;
  }, []);

  const savePreset = useCallback(async (name, items) => {
    const preset = await api.savePreset(name, items);
    setPresets(prev => [...prev, preset]);
    return preset;
  }, []);

  const deletePreset = useCallback(async (id) => {
    await api.deletePreset(id);
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const createCustomFood = useCallback(async (data) => {
    const result = await api.createCustomFood(data);
    // Refetch foods to get updated list
    const foodR = await api.getFoods();
    setFoods(foodR);
    return result;
  }, []);

  const deleteCustomFood = useCallback(async (foodId) => {
    await api.deleteCustomFood(foodId);
    const foodR = await api.getFoods();
    setFoods(foodR);
  }, []);

  return { config, schedule, days, stats, foods, presets, loading, updateDay, savePreset, deletePreset, createCustomFood, deleteCustomFood, refetch: fetchAll };
}
