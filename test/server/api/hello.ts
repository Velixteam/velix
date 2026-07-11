export function GET() {
  return Response.json({ message: "Hello from Velix API!" });
}

export function POST(_request: Request) {
  return Response.json({ received: true });
}
