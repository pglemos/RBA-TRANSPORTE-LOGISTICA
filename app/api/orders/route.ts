import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';
import { FreightOrderSchema } from '@/lib/validators';
import { signFreightOrderProof } from '@/lib/proof';
import { normalizeFreightOrderStatus, syncFreightOrderStatuses } from '@/lib/freightStatus';
import {
  findDriverByCpf,
  findVehicleByTractorPlate,
  parseInlineDriverPayload,
  parseInlineVehiclePayload,
} from '@/lib/freightOrderInlineRegistration';

export async function GET(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req);
    if (guard.response) return guard.response;
 
    const role = guard.session.user!.role;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const driverId = searchParams.get('driver_id') || '';
    const clientId = searchParams.get('client_id') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('page_size') || '50');
 
    const orders = await RBADatabase.getFreightOrders({ search, status: '', driverId, clientId, page, pageSize, startDate, endDate });

    const driverIds = Array.from(new Set(orders.map((o) => o.driver_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set(orders.map((o) => o.vehicle_id).filter(Boolean)));
    const clientIds = Array.from(new Set(orders.map((o) => o.client_id).filter(Boolean)));

    const [drivers, vehicles, clients] = await Promise.all([
      RBADatabase.getDriversByIds(driverIds),
      RBADatabase.getVehiclesByIds(vehicleIds),
      RBADatabase.getClientsByIds(clientIds),
    ]);

    const populated = orders
      .map((order) => {
        const driver = drivers.find((item) => item.id === order.driver_id);
        const vehicle = vehicles.find((item) => item.id === order.vehicle_id);
        const client = clients.find((item) => item.id === order.client_id);
        const syncedStatuses = syncFreightOrderStatuses(order);

        return {
          ...order,
          ...syncedStatuses,
          driver_name: driver ? driver.name : 'N/A',
          driver_cpf: driver ? RBAAuth.maskCPF(driver.cpf, role) : 'N/A',
          driver_status: driver ? driver.status : 'Ativo',
          vehicle_tractor_plate: vehicle ? vehicle.tractor_plate : 'N/A',
          vehicle_trailer_plate: vehicle ? vehicle.trailer_plate : 'N/A',
          vehicle_model: vehicle ? vehicle.model : 'N/A',
          client_name: client ? client.name : 'N/A',
          client_document: client ? RBAAuth.maskDocument(client.document, role) : 'N/A',
          pdf_proof_token: signFreightOrderProof(order),
        };
      })
      .filter((order) => !status || normalizeFreightOrderStatus(order.status) === normalizeFreightOrderStatus(status));

    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await RBAAuth.requireAuth(req, ['Administrador', 'Operacional']);
    if (guard.response) return guard.response;

    const session = guard.session.user!;
    const body = await req.json();

    let matchedDriver = body.driver_id ? await RBADatabase.getDriverById(body.driver_id) : undefined;
    if (!matchedDriver && body.driver) {
      const parsedDriver = parseInlineDriverPayload(body.driver);
      if (!parsedDriver.success) {
        return NextResponse.json(
          { success: false, error: parsedDriver.error.issues[0]?.message || 'Dados do motorista inválidos.' },
          { status: 400 },
        );
      }

      const existingDriver = findDriverByCpf(await RBADatabase.getDrivers(), parsedDriver.data.cpf);
      matchedDriver = existingDriver || await RBADatabase.createDriver(
        {
          ...parsedDriver.data,
          notes: parsedDriver.data.notes || '',
          phone: parsedDriver.data.phone || '',
          rg: parsedDriver.data.rg || '',
          bank_name: parsedDriver.data.bank_name || '',
          bank_agency: parsedDriver.data.bank_agency || '',
          bank_account: parsedDriver.data.bank_account || '',
          pix_key: parsedDriver.data.pix_key || '',
          beneficiary_name: parsedDriver.data.beneficiary_name || '',
          beneficiary_document: parsedDriver.data.beneficiary_document || '',
        },
        session.id,
        session.name,
      );
    }

    let matchedVehicle = body.vehicle_id ? await RBADatabase.getVehicleById(body.vehicle_id) : undefined;
    if (!matchedVehicle && body.vehicle) {
      const parsedVehicle = parseInlineVehiclePayload(body.vehicle);
      if (!parsedVehicle.success) {
        return NextResponse.json(
          { success: false, error: parsedVehicle.error.issues[0]?.message || 'Dados do veículo inválidos.' },
          { status: 400 },
        );
      }

      const existingVehicle = findVehicleByTractorPlate(await RBADatabase.getVehicles(), parsedVehicle.data.tractor_plate);
      matchedVehicle = existingVehicle || await RBADatabase.createVehicle(
        {
          ...parsedVehicle.data,
          antt: parsedVehicle.data.antt || '',
          renavam: parsedVehicle.data.renavam || '',
          notes: parsedVehicle.data.notes || '',
        },
        session.id,
        session.name,
      );
    }

    const payload = {
      ...body,
      driver_id: matchedDriver?.id || body.driver_id,
      vehicle_id: matchedVehicle?.id || body.vehicle_id,
      freight_value: Number(body.freight_value) || 0,
      advance_value: Number(body.advance_value) || 0,
      cash_value: Number(body.cash_value) || 0,
      balance_value: Number(body.balance_value) || 0,
      loading_expense: Number(body.loading_expense) || 0,
      unloading_expense: Number(body.unloading_expense) || 0,
      other_expenses: Number(body.other_expenses) || 0,
      cte_value: Number(body.cte_value) || 0,
      cte_discount_percent: Number(body.cte_discount_percent ?? 10),
    };

    const parsed = FreightOrderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados da ficha inválidos.' },
        { status: 400 },
      );
    }

    const matchedClient = await RBADatabase.getClientById(parsed.data.client_id);

    if (!matchedDriver) {
      return NextResponse.json({ success: false, error: 'Motorista informado não existe ou foi removido.' }, { status: 400 });
    }
    if (!matchedVehicle) {
      return NextResponse.json({ success: false, error: 'Veículo informado não existe ou foi removido.' }, { status: 400 });
    }
    if (!matchedClient) {
      return NextResponse.json({ success: false, error: 'Cliente informado não existe ou foi removido.' }, { status: 400 });
    }

    const bankSnapshot = {
      bank_name: matchedDriver.bank_name,
      bank_agency: matchedDriver.bank_agency,
      bank_account: matchedDriver.bank_account,
      pix_key: matchedDriver.pix_key,
      beneficiary_name: matchedDriver.beneficiary_name || matchedDriver.name,
    };
    const syncedStatuses = syncFreightOrderStatuses(parsed.data);

    const newOrder = await RBADatabase.createFreightOrder(
      {
        ...parsed.data,
        ...syncedStatuses,
        bank_data_snapshot: bankSnapshot,
        created_by: session.name,
        updated_by: session.name,
        approved_by: '',
        approved_at: '',
        responsible_name: parsed.data.responsible_name || session.name,
        cte_number: parsed.data.cte_number || '',
        notes: parsed.data.notes || '',
        signature_url: parsed.data.signature_url || '',
      },
      session.id,
      session.name,
    );

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
