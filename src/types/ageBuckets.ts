import type {Guest} from "@/types/index";
import {machineAgeMs} from "@/utils/common";

export const AGE_BUCKET_ORDER = ['<1y', "1y+", "2y+", "3y+", "4y+", "5y+", 'unknown'] as const;
export const AGE_FILTER_OPTIONS = [
    {value: 'lt1y', label: '<1y'},
    {value: 'gt1y', label: '> 1 year'},
    {value: 'gt2y', label: '> 2 year'},
    {value: 'gt3y', label: '> 3 year'},
    {value: 'gt4y', label: '> 4 year'},
    {value: 'gt5y', label: '> 5 year'},
    {value: 'unknown', label: 'Unknown age'},
] as const;

function getGuestAgeMs(created?: string) {
    if (!created) return null;
    const ageMs = machineAgeMs(created);
    return Number.isFinite(ageMs) ? ageMs : null;
}

const DAY_MS = 86400000;

export type AgeFilterValue = 'lt1y' | 'gt1y' | 'gt2y' | 'gt3y' | 'gt4y' | 'gt5y' | 'unknown';

export function getGuestAgeBucket(guest: Guest): AgeFilterValue {
    const ageMs = getGuestAgeMs(guest.created);
    if (ageMs === null) return 'unknown';
    if (ageMs < 365 * DAY_MS) return 'lt1y';
    if (ageMs < (365 * 2) * DAY_MS) return 'gt1y';
    if (ageMs < (365 * 3) * DAY_MS) return 'gt2y';
    if (ageMs < (365 * 4) * DAY_MS) return 'gt3y';
    if (ageMs < (365 * 5) * DAY_MS) return 'gt4y';
    return 'gt5y';
}