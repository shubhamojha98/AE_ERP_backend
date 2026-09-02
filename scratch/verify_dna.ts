// scratch/verify_dna.ts
import { resolvePermissionDNA } from '../middleware/dynamicPermission';
import { AuthenticatedRequest } from '../src/core/types';

const testCases = [
    { method: 'POST', url: '/api/water/setup/add-category', name: 'Water Add Category' },
    { method: 'GET', url: '/api/water/list/123/page', name: 'Water Consumer Page' },
    { method: 'PUT', url: '/api/water/update/555', name: 'Water Update' },
    { method: 'DELETE', url: '/api/water/delete/999', name: 'Water Delete' },
    { method: 'POST', url: '/api/panel/master/menu', name: 'Panel Master Menu' }
];

testCases.forEach(tc => {
    const req = {
        method: tc.method,
        originalUrl: tc.url,
    } as AuthenticatedRequest;

    const dna = resolvePermissionDNA(req);
    console.log(`\n[Test: ${tc.name}] -> ${tc.method} ${tc.url}`);
    console.log(`Derived DNA Chain:`, dna);
});
