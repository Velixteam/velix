export function GET() {
  return Response.json({ message: "Hello from Velix API!" });
}

export function POST(request: any) {
  return Response.json({ received: true });
}
