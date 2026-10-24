import { requireApiUser, tenantFilter } from "../../../lib/auth.js";
import Member from "../../../models/Member.js";
import Payment from "../../../models/Payment.js";
import Attendance from "../../../models/Attendance.js";
import { csvRow } from "../../../lib/csv.js";
import { errorResponse } from "../../../lib/planApiResponse.js";

export async function GET(request) {
  const denied = await requireApiUser(request);
  if (denied) return denied;
  const resource = new URL(request.url).searchParams.get("resource") || "members";
  const definitions = {
    members: { model: Member, fields: ["fullName", "phone", "email", "startDate", "expiryDate", "isActive"] },
    payments: { model: Payment, fields: ["receiptNumber", "memberId", "amountDue", "amountPaid", "method", "paymentDate"] },
    attendance: { model: Attendance, fields: ["memberId", "date", "checkInAt", "checkOutAt"] },
  };
  const definition = Object.hasOwn(definitions, resource) ? definitions[resource] : null;
  if (!definition) return errorResponse("Choose members, payments, or attendance.", 400);
  const cursor = definition.model.find(tenantFilter(request)).select(definition.fields.join(" ")).sort({ _id: 1 }).lean().cursor();
  const encoder = new TextEncoder();
  let header = false;
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        if (!header) { header = true; controller.enqueue(encoder.encode(csvRow(definition.fields))); return; }
        const row = await cursor.next();
        if (!row) { await cursor.close(); controller.close(); return; }
        controller.enqueue(encoder.encode(csvRow(definition.fields.map((field) => row[field]))));
      } catch (error) { await cursor.close(); controller.error(error); }
    },
    async cancel() { await cursor.close(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="fitivo-${resource}.csv"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
