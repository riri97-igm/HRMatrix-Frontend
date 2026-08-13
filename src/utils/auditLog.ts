import { employeeApi } from '../services/api';

export type AuditAction =
    | 'Created' | 'Updated' | 'Deleted'
    | 'Approved' | 'Rejected' | 'Generated'
    | 'Applied' | 'Settled' | 'Login' | 'Logout';

export type AuditEntity =
    | 'Employee' | 'Department' | 'Leave'
    | 'Payroll' | 'Loan' | 'User';

export const logAction = async (
    action: AuditAction,
    entityType: AuditEntity,
    entityId: string,
    description: string
) => {
    try {
        await employeeApi.post('/api/auditlog', {
            action,
            entityType,
            entityId,
            description,
        });
    } catch {
        // Silently fail — audit log should never break main flow
    }
};