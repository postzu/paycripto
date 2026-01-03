import { supabase } from '@/infrastructure/supabase/client';

export type EventName =
    | 'send_wizard_start'
    | 'send_wizard_asset_selected'
    | 'send_wizard_amount_entered'
    | 'send_wizard_estimate_fee'
    | 'send_wizard_submit'
    | 'send_wizard_success'
    | 'send_wizard_error';

export interface AnalyticsEvent {
    event_name: EventName;
    properties?: Record<string, unknown>;
}

/**
 * Logs an event to Supabase and console (in development).
 * Fails gracefully to avoid breaking the user experience.
 */
export async function logEvent(name: EventName, properties?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${name}`, properties);
    }

    try {
        const { error } = await supabase
            .from('events')
            .insert([
                {
                    event_name: name,
                    properties: properties || {}
                }
            ]);

        if (error) {
            console.error(`[Analytics] Error inserting event "${name}":`, error);
        }
    } catch (e) {
        console.error(`[Analytics] Unexpected error logging event "${name}":`, e);
    }
}
