import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook that manages WhatsApp daily logging reminders.
 * Controls the server-side reminder loop that sends messages via Twilio.
 */
export function useReminders() {
  const [status, setStatus] = useState(null);
  const [reminderConfig, setReminderConfig] = useState(null);
  const [sending, setSending] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        api.getReminderStatus(),
        api.getReminderConfig(),
      ]);
      setStatus(s);
      setReminderConfig(c);
    } catch (err) {
      console.warn('Reminder check failed:', err);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const startReminders = useCallback(async () => {
    const res = await api.startReminders();
    setReminderConfig(prev => ({ ...prev, running: true }));
    return res;
  }, []);

  const stopReminders = useCallback(async () => {
    const res = await api.stopReminders();
    setReminderConfig(prev => ({ ...prev, running: false }));
    return res;
  }, []);

  const sendNow = useCallback(async () => {
    setSending(true);
    try {
      const res = await api.sendReminder();
      return res;
    } finally {
      setSending(false);
    }
  }, []);

  return {
    status,
    reminderConfig,
    sending,
    startReminders,
    stopReminders,
    sendNow,
    refresh: fetchStatus,
  };
}
