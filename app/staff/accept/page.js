import AcceptStaffInvitation from "../../../components/staff/accept-staff-invitation";

export default async function AcceptStaffInvitationPage({ searchParams }) {
  const { token = "" } = await searchParams;
  return <AcceptStaffInvitation token={token} />;
}
