// lib/permissions.ts
import { Session } from './auth';

export type AppRole = 'Administrador' | 'Operacional' | 'Financeiro' | 'Consulta/Auditoria';

export class RBAPermissions {
  // Check if role is allowed to perform a certain action
  public static canManageUsers(role: AppRole): boolean {
    return role === 'Administrador';
  }

  public static canDeleteFinancialData(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static canEditFinance(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static canCreateOrder(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Operacional';
  }

  public static canApproveOrder(role: AppRole): boolean {
    return role === 'Administrador' || role === 'Financeiro';
  }

  public static isReadOnly(role: AppRole): boolean {
    return role === 'Consulta/Auditoria';
  }

  // LGPD Masking Rules checking
  public static shouldMaskSensitiveData(role: AppRole): boolean {
    return role === 'Consulta/Auditoria';
  }
}
