import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { FreightOrderSchema } from '@/lib/validators';
import { signFreightOrderProof } from '@/lib/proof';
import { normalizeFreightOrderStatus, syncFreightOrderStatuses } from '@/lib/freightStatus';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);
    const role = session.user?.role || 'Consulta/Auditoria';

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const driverId = searchParams.get('driver_id') || '';
    const clientId = searchParams.get('client_id') || '';
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('page_size') || '50');

    const orders = await RBADatabase.getFreightOrders({ search, status: '', driverId, clientId, page, pageSize });
    const drivers = await RBADatabase.getDrivers();
    const vehicles = await RBADatabase.getVehicles();
    const clients = await RBADatabase.getClients();

    // Map profiles/relations and filter
    const populated = orders.map(ord => {
      const driver = drivers.find(d => d.id === ord.driver_id);
      const vehicle = vehicles.find(v => v.id === ord.vehicle_id);
      const client = clients.find(c => c.id === ord.client_id);
      const syncedStatuses = syncFreightOrderStatuses(ord);

      return {
        ...ord,
        ...syncedStatuses,
        driver_name: driver ? driver.name : "N/A",
        driver_cpf: driver ? RBAAuth.maskCPF(driver.cpf, role) : "N/A",
        vehicle_plate: vehicle ? `${vehicle.tractor_plate} / ${vehicle.trailer_plate}` : "N/A",
        vehicle_tractor_plate: vehicle ? vehicle.tractor_plate : "N/A",
        vehicle_trailer_plate: vehicle ? vehicle.trailer_plate : "N/A",
        vehicle_model: vehicle ? vehicle.model : "N/A",
        vehicle_year: vehicle ? vehicle.year : "N/A",
        client_name: client ? client.name : "N/A",
        pdf_proof_token: signFreightOrderProof(ord)
      };
    }).filter((ord) => !status || normalizeFreightOrderStatus(ord.status) === normalizeFreightOrderStatus(status));

    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const session = RBAAuth.getSession(cookieHeader);

    if (!session.user || RBAAuth.isReadOnly(session.user.role)) {
      return NextResponse.json({ success: false, error: "Acesso negado: Somente perfis operacionais ou administrativos." }, { status: 403 });
    }

    const body = await req.json();

    const payload = {
      ...body,
      freight_value: Number(body.freight_value) || 0,
      advance_value: Number(body.advance_value) || 0,
      cash_value: Number(body.cash_value) || 0,
      loading_expense: Number(body.loading_expense) || 0,
      unloading_expense: Number(body.unloading_expense) || 0,
      other_expenses: Number(body.other_expenses) || 0,
      cte_value: Number(body.cte_value) || 0,
      cte_discount_percent: Number(body.cte_discount_percent ?? 10)
    };
    const parsed = FreightOrderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Dados da ficha inválidos.' }, { status: 400 });
    }

    // Capture driver snapshot bank information as requested by PRD "data_snapshot"
    const [matchedDriver, matchedVehicle, matchedClient] = await Promise.all([
      RBADatabase.getDriverById(parsed.data.driver_id),
      RBADatabase.getVehicleById(parsed.data.vehicle_id),
      RBADatabase.getClientById(parsed.data.client_id)
    ]);
    if (!matchedDriver) {
      return NextResponse.json({ success: false, error: "Motorista informado não existe ou foi removido." }, { status: 400 });
    }
    if (!matchedVehicle) {
      return NextResponse.json({ success: false, error: "Veículo informado não existe ou foi removido." }, { status: 400 });
    }
    if (!matchedClient) {
      return NextResponse.json({ success: false, error: "Cliente informado não existe ou foi removido." }, { status: 400 });
    }

    const bankSnapshot = {
      bank_name: matchedDriver.bank_name,
      bank_agency: matchedDriver.bank_agency,
      bank_account: matchedDriver.bank_account,
      pix_key: matchedDriver.pix_key,
      beneficiary_name: matchedDriver.beneficiary_name || matchedDriver.name
    };

    const syncedStatuses = syncFreightOrderStatuses(parsed.data);
    const newOrder = await RBADatabase.createFreightOrder({
      ...parsed.data,
      ...syncedStatuses,
      bank_data_snapshot: bankSnapshot,
      created_by: session.user.name,
      approved_by: '',
      approved_at: '',
      responsible_name: parsed.data.responsible_name || session.user.name,
      cte_number: parsed.data.cte_number || '',
      notes: parsed.data.notes || ''
    }, session.user.id, session.user.name);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
