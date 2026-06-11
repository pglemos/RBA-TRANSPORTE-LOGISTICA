import { Profile } from './db';

// Simple check permissions helper
export type AppRole = Profile['role'];

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
    active: boolean;
  } | null;
}

// Memory session for server container (fallback if cookies not set yet)
let currentServerSession: Session = {
  user: {
    id: "user_admin",
    name: "Morgan Ribeiro (Admin)",
    email: "admin@rba.com",
    role: "Administrador",
    active: true
  }
};

export class RBAAuth {
  // Get active session
  public static getSession(cookieHeader?: string): Session {
    // If we have custom cookies in request, we can parse them
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [k, v] = c.trim().split('=');
          return [k, decodeURIComponent(v || '')];
        })
      );
      if (cookies.rba_role && cookies.rba_user_id && cookies.rba_user_name) {
        return {
          user: {
            id: cookies.rba_user_id,
            name: cookies.rba_user_name,
            email: cookies.rba_user_email || `${cookies.rba_user_id}@rba.com`,
            role: cookies.rba_role as AppRole,
            active: true
          }
        };
      }
    }
    return currentServerSession;
  }

  // Update server fallback session (used to sync role select mock bar easily)
  public static setFallbackSession(user: Session['user']) {
    currentServerSession = { user };
  }

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

  // LGPD Masking Utilities
  public static maskCPF(cpf: string, role?: AppRole): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (role === 'Administrador' || role === 'Financeiro') {
      // Show styled full if authorized
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    // Masked for audit or public
    return clean.replace(/(\d{3})\d{6}(\d{2})/, "$1.***.***-$2");
  }

  public static maskDocument(document: string, role?: AppRole): string {
    if (!document) return '';
    const clean = document.replace(/\D/g, '');
    if (clean.length === 11) {
      return this.maskCPF(clean, role);
    }
    if (clean.length === 14) {
      if (role === 'Administrador' || role === 'Financeiro') {
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      }
      return clean.replace(/(\d{2})\d{6}(\d{4})(\d{2})/, "$1.***.***/$2-$3");
    }
    return role === 'Administrador' || role === 'Financeiro' ? document : 'Documento protegido (LGPD)';
  }

  public static maskRG(rg: string, role?: AppRole): string {
    if (!rg) return '';
    const clean = rg.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (role === 'Administrador' || role === 'Financeiro') {
      return rg;
    }
    if (clean.length >= 8) {
      return clean.substring(0, 2) + '.***.***-' + clean.charAt(clean.length - 1);
    }
    return '***-**';
  }

  public static maskBankDetails(account: string, role?: AppRole): string {
    if (!account) return '';
    if (role === 'Administrador' || role === 'Financeiro') {
      return account;
    }
    const clean = account.replace(/[^A-Za-z0-9]/g, '');
    if (clean.length > 2) {
      return '****-' + clean.slice(-2);
    }
    return '****';
  }

  public static maskPixKey(key: string, role?: AppRole): string {
    if (!key) return '';
    if (role === 'Administrador' || role === 'Financeiro') {
      return key;
    }
    // Simple mask
    if (key.includes('@')) {
      const parts = key.split('@');
      return parts[0].substring(0, 2) + '***@' + parts[1];
    }
    if (key.length >= 11) {
      return key.substring(0, 3) + '.***.***-' + key.slice(-2);
    }
    return 'Chave Pix Protegida (LGPD)';
  }
}
