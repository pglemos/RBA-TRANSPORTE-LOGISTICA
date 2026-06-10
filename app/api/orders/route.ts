import { NextRequest, NextResponse } from 'next/server';
import { RBADatabase } from '@/lib/db';
import { RBAAuth } from '@/lib/auth';

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

    const orders = await RBADatabase.getFreightOrders();
    const drivers = await RBADatabase.getDrivers();
    const vehicles = await RBADatabase.getVehicles();
    const clients = await RBADatabase.getClients();

    // Map profiles/relations and filter
    const populated = orders.map(ord => {
      const driver = drivers.find(d => d.id === ord.driver_id);
      const vehicle = vehicles.find(v => v.id === ord.vehicle_id);
      const client = clients.find(c => c.id === ord.client_id);

      return {
        ...ord,
        driver_name: driver ? driver.name : "N/A",
        driver_cpf: driver ? RBAAuth.maskCPF(driver.cpf, role) : "N/A",
        vehicle_plate: vehicle ? `${vehicle.tractor_plate} / ${vehicle.trailer_plate}` : "N/A",
        vehicle_tractor_plate: vehicle ? vehicle.tractor_plate : "N/A",
        vehicle_trailer_plate: vehicle ? vehicle.trailer_plate : "N/A",
        vehicle_model: vehicle ? vehicle.model : "N/A",
        vehicle_year: vehicle ? vehicle.year : "N/A",
        client_name: client ? client.name : "N/A"
      };
    });

    const filtered = populated.filter(ord => {
      if (status && ord.status !== status) return false;
      if (driverId && ord.driver_id !== driverId) return false;
      if (clientId && ord.client_id !== clientId) return false;
      if (search) {
        const matchNumber = ord.order_number?.toLowerCase().includes(search);
        const matchDriver = ord.driver_name.toLowerCase().includes(search);
        const matchClient = ord.client_name.toLowerCase().includes(search);
        const matchOrigin = ord.origin?.toLowerCase().includes(search);
        const matchDest = ord.destination?.toLowerCase().includes(search);
        const matchVehicle = ord.vehicle_plate.toLowerCase().includes(search);
        return matchNumber || matchDriver || matchClient || matchOrigin || matchDest || matchVehicle;
      }
      return true;
    });

    return NextResponse.json(filtered);
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

    // Enforce basic required properties as per PRD validations
    if (!body.driver_id) {
      return NextResponse.json({ success: false, error: "Identificação do motorista é obrigatória." }, { status: 400 });
    }
    if (!body.vehicle_id) {
      return NextResponse.json({ success: false, error: "O veículo conjugado (cavalo/carreta) é obrigatório." }, { status: 400 });
    }
    if (!body.client_id) {
      return NextResponse.json({ success: false, error: "O cliente pagador é obrigatório." }, { status: 400 });
    }
    if (!body.origin || !body.destination) {
      return NextResponse.json({ success: false, error: "Cidades de origem e destino são obrigatórias para a viagem." }, { status: 400 });
    }
    if (Number(body.freight_value) <= 0) {
      return NextResponse.json({ success: false, error: "O valor bruto do frete deve ser maior que zero." }, { status: 400 });
    }
    if (String(body.buonny_code || '').length > 20) {
      return NextResponse.json({ success: false, error: "O código da consulta Buonny deve ter no máximo 20 caracteres." }, { status: 400 });
    }

    // Capture driver snapshot bank information as requested by PRD "data_snapshot"
    const matchedDriver = await RBADatabase.getDriverById(body.driver_id);
    const bankSnapshot = matchedDriver ? {
      bank_name: matchedDriver.bank_name,
      bank_agency: matchedDriver.bank_agency,
      bank_account: matchedDriver.bank_account,
      pix_key: matchedDriver.pix_key,
      beneficiary_name: matchedDriver.beneficiary_name || matchedDriver.name
    } : {
      bank_name: "N/A",
      bank_agency: "N/A",
      bank_account: "N/A",
      pix_key: "N/A",
      beneficiary_name: "N/A"
    };

    const newOrder = await RBADatabase.createFreightOrder({
      ...body,
      bank_data_snapshot: bankSnapshot,
      created_by: session.user.name,
      responsible_name: session.user.name,
      status: body.status || 'Rascunho'
    }, session.user.id, session.user.name);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
