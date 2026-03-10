// src/utils/export.ts
import type {Machine} from '@/types';

export function exportJson(machines: Machine[], filename = 'vms') {
    const blob = new Blob([JSON.stringify(machines, null, 2)], {type: 'application/json'});
    triggerDownload(blob, `${filename}.json`);
}

export function exportCsv(machines: Machine[], filename = 'vms') {
    const headers: (keyof Machine)[] = [
        'name', 'ip', 'power', 'folder', 'group', 'sub_group',
        'owner', 'cpu', 'ram', 'created', 'power_on_time', 'os',
    ];

    const escape = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        // Wrap in quotes if value contains comma, quote, or newline
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = [
        headers.join(','),
        ...machines.map(m => headers.map(h => escape(m[h])).join(',')),
    ];

    const blob = new Blob([rows.join('\n')], {type: 'text/csv;charset=utf-8;'});
    triggerDownload(blob, `${filename}.csv`);
}

function triggerDownload(blob: Blob, filename: string) {
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}